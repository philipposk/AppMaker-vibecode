// AI generation via llm-free-rotator (OpenRouter, all free models).
// Fresh generate (optionally saved as an `apps` row) + refine (appId → new
// `iterations` row + updated app). Aligned to the shared `appmaker` schema.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatWithRotation, type ChatMessage } from "@/lib/llm-rotator";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { packCode, unpackCode, deriveName, APP_TYPE } from "@/lib/appmaker-db";

const SYSTEM = `You are AppMaker, an expert front-end developer. The user describes a small web app or tool.
You respond with a SINGLE self-contained HTML file that includes inline CSS and inline JavaScript.
Rules:
- No external CDN links, no frameworks. Pure HTML/CSS/JS only.
- Must work when pasted into a blank .html file and opened in a browser.
- Accessible: semantic HTML, labelled controls, keyboard usable.
- Dark modern UI by default unless specified.
- Return ONLY the HTML — no explanation, no markdown fences, no code block markers.
- Start with <!DOCTYPE html>.`;

function stripFences(s: string): string {
  return s.replace(/^```html?\s*/i, "").replace(/```\s*$/, "").trim();
}

export async function POST(req: Request) {
  // Rate limit per IP — protects the shared free model pool.
  const ip = clientIp(req);
  const rl = rateLimit(`generate:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: { prompt?: string; save?: boolean; appId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { prompt, save, appId } = body;
  if (!prompt?.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });
  if (prompt.length > 4000) return NextResponse.json({ error: "prompt too long (max 4000 chars)" }, { status: 400 });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });

  const isRefine = Boolean(appId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For refine we need the existing app (RLS guarantees ownership).
  let previousHtml = "";
  if (isRefine) {
    if (!user) return NextResponse.json({ error: "sign in to refine an app" }, { status: 401 });
    const { data: app, error } = await supabase
      .from("apps")
      .select("id, generated_code")
      .eq("id", appId)
      .single();
    if (error || !app) return NextResponse.json({ error: "app not found" }, { status: 404 });
    previousHtml = unpackCode(app.generated_code);
  }

  const messages: ChatMessage[] = isRefine
    ? [
        { role: "system", content: SYSTEM },
        { role: "user", content: "Here is the current HTML app:\n\n" + previousHtml },
        { role: "user", content: "Apply this change and return the FULL updated HTML file:\n\n" + prompt },
      ]
    : [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ];

  const startedAt = Date.now();
  let result: { text: string; model: string };
  try {
    result = await chatWithRotation(apiKey, messages, {
      referer: "https://appmaker.6x7.gr",
      title: "AppMaker",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  const html = stripFences(result.text);
  if (!html) return NextResponse.json({ error: "model returned empty output, retry" }, { status: 502 });

  const durationMs = Date.now() - startedAt;
  let savedAppId: string | null = appId ?? null;
  let saveError: string | null = null;

  // Persist (refine always persists; fresh generate only if save=true + signed in).
  if ((isRefine || save) && user) {
    try {
      if (isRefine) {
        const { error: upErr } = await supabase
          .from("apps")
          .update({ generated_code: packCode(html), status: "ready", updated_at: new Date().toISOString() })
          .eq("id", appId);
        if (upErr) throw upErr;
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from("apps")
          .insert({
            user_id: user.id,
            name: deriveName(prompt),
            description: prompt,
            type: APP_TYPE,
            status: "ready",
            generated_code: packCode(html),
            generation: { provider: "openrouter", model: result.model },
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        savedAppId = inserted.id;
      }

      // Log the iteration (best-effort; don't fail the request on log error).
      if (savedAppId) {
        await supabase.from("iterations").insert({
          app_id: savedAppId,
          user_id: user.id,
          prompt,
          provider: "openrouter",
          model: result.model,
          duration_ms: durationMs,
          source: isRefine ? "refine" : "create",
        });
      }
    } catch (e) {
      saveError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    html,
    model: result.model,
    appId: savedAppId,
    saved: (isRefine || save) ? !saveError : false,
    saveError,
  });
}
