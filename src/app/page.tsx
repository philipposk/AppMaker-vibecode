import Generator from "@/components/Generator";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
      {/* Hero */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.875rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1rem" }}>
          AI app builder
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
          Describe it. Get the code.<br />
          <span style={{ color: "var(--accent)" }}>In under a second.</span>
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "1rem", lineHeight: 1.6, maxWidth: "36rem", margin: "0 auto" }}>
          Type what you want to build. AppMaker calls Groq and hands you a working HTML/CSS/JS file instantly.
          {!user && <> <a href="/auth/sign-in" style={{ color: "var(--accent)" }}>Sign in</a> to save your creations.</>}
        </p>
      </div>

      <Generator isLoggedIn={!!user} />
    </div>
  );
}
