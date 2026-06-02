import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AuthButton() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return (
      <form action="/auth/sign-out" method="post">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>
            {user.email}
          </span>
          <button type="submit" className="btn btn-ghost" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
            Sign out
          </button>
        </div>
      </form>
    );
  }

  return (
    <Link href="/auth/sign-in" className="btn btn-ghost" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
      Sign in
    </Link>
  );
}
