import { createClient } from "@/lib/supabase/server";
import { unpackCode, type AppRow } from "@/lib/appmaker-db";
import AppEditor from "@/components/AppEditor";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface IterationRow {
  id: string;
  prompt: string | null;
  model: string | null;
  provider: string | null;
  source: string;
  duration_ms: number | null;
  created_at: string;
}

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div style={{ maxWidth: "40rem", margin: "6rem auto", padding: "0 1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--fg-muted)", marginBottom: "1.5rem" }}>Sign in to view this app.</p>
        <Link href="/auth/sign-in" className="btn btn-primary">Sign in</Link>
      </div>
    );
  }

  const { data: app } = await supabase
    .from("apps")
    .select("id, name, description, type, status, generated_code, generation, created_at, updated_at")
    .eq("id", id)
    .single();

  if (!app) notFound();
  const row = app as AppRow;

  const { data: iterData } = await supabase
    .from("iterations")
    .select("id, prompt, model, provider, source, duration_ms, created_at")
    .eq("app_id", id)
    .order("created_at", { ascending: false });

  const iterations = (iterData ?? []) as IterationRow[];

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "2rem 1.5rem 6rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/my-apps" style={{ color: "var(--fg-muted)", fontSize: "0.82rem" }}>← My Apps</Link>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginTop: "0.5rem" }}>{row.name}</h1>
        {row.description && (
          <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>{row.description}</p>
        )}
      </div>

      <AppEditor id={row.id} name={row.name} initialHtml={unpackCode(row.generated_code)} />

      {/* Iteration history */}
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>
          History <span style={{ color: "var(--fg-muted)", fontWeight: 400 }}>· {iterations.length}</span>
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {iterations.map((it) => (
            <div key={it.id} className="glass" style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: it.source === "create" ? "var(--accent)" : "var(--fg-muted)", minWidth: "3.5rem" }}>
                {it.source}
              </span>
              <span style={{ flex: 1, fontSize: "0.85rem", minWidth: "200px" }}>{it.prompt || <em style={{ color: "var(--fg-muted)" }}>—</em>}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>
                {(it.model || "").replace(":free", "")}{it.duration_ms ? ` · ${(it.duration_ms / 1000).toFixed(1)}s` : ""}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>
                {new Date(it.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {iterations.length === 0 && (
            <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>No history recorded.</p>
          )}
        </div>
      </section>
    </div>
  );
}
