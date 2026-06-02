// AI generation via llm-free-rotator (OpenRouter, all free models).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatWithRotation } from "@/lib/llm-rotator";

const SYSTEM = `You are AppMaker, an expert front-end developer. The user describes a small web app or tool.
You respond with a SINGLE self-contained HTML file that includes inline CSS and inline JavaScript.
Rules:
- No external CDN links, no frameworks. Pure HTML/CSS/JS only.
- Must work when pasted into a blank .html file and opened in a browser.
- Dark modern UI by default unless specified.
- Return ONLY the HTML — no explanation, no markdown fences, no code block markers.
- Start with <!DOCTYPE html>.`;

export async function POST(req: Request) {
  const { prompt, save } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });

  let result: { text: string; model: string };
  try {
    result = await chatWithRotation(
      apiKey,
      [
        { role: "system", content: SYSTEM },
        { role: "user",   content: prompt },
      ],
      { referer: "https://appmaker.6x7.gr", title: "AppMaker" },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  let html = result.text;
  // Strip accidental code fences
  html = html.replace(/^```html?\s*/i, "").replace(/```\s*$/, "").trim();

  if (save) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const title = prompt.slice(0, 60);
      await supabase.from("generations").insert({ user_id: user.id, prompt, html, title, model: result.model });
    }
  }

  return NextResponse.json({ html, model: result.model });
}
