import { createClient } from "@/lib/supabase/server";
import { unpackCode, type AppRow } from "@/lib/appmaker-db";
import AppCard from "./AppCard";
import Link from "next/link";

export const metadata = { title: "My Apps — AppMaker" };
export const dynamic = "force-dynamic";

export default async function MyAppsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div style={{ maxWidth: "40rem", margin: "6rem auto", padding: "0 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.75rem" }}>My Apps</h1>
        <p style={{ color: "var(--fg-muted)", marginBottom: "1.5rem" }}>
          Sign in to see the apps you’ve saved.
        </p>
        <Link href="/auth/sign-in" className="btn btn-primary">Sign in</Link>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("apps")
    .select("id, name, description, type, status, generated_code, generation, created_at, updated_at")
    .order("updated_at", { ascending: false });

  const apps = (data ?? []) as AppRow[];

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.8rem" }}>My Apps</h1>
          <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
            {apps.length} saved {apps.length === 1 ? "app" : "apps"}
          </p>
        </div>
        <Link href="/" className="btn btn-primary">+ New app</Link>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", padding: "1rem", color: "#fca5a5" }}>
          Could not load apps: {error.message}
        </div>
      )}

      {!error && apps.length === 0 && (
        <div className="glass" style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)" }}>
          No saved apps yet. <Link href="/" style={{ color: "var(--accent)" }}>Generate one</Link> and hit Save.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {apps.map((a) => (
          <AppCard
            key={a.id}
            id={a.id}
            name={a.name}
            description={a.description}
            status={a.status}
            updatedAt={a.updated_at}
            html={unpackCode(a.generated_code)}
          />
        ))}
      </div>
    </div>
  );
}
