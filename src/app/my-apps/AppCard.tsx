"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AppCard({
  id, name, description, status, updatedAt, html,
}: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  html: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const remove = async () => {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("apps").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
      setDeleting(false);
      return;
    }
    router.refresh();
  };

  const openFull = () => {
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${name.replace(/[^\w-]+/g, "_").slice(0, 40) || "app"}.html`;
    a.click();
  };

  return (
    <div className="glass" style={{ display: "flex", flexDirection: "column", overflow: "hidden", opacity: deleting ? 0.5 : 1 }}>
      {/* Live preview thumbnail */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Toggle preview"
        style={{ border: "none", padding: 0, cursor: "pointer", background: "#0a0a0f", height: open ? "320px" : "150px", overflow: "hidden", position: "relative" }}
      >
        <iframe
          srcDoc={html}
          sandbox=""
          title={name}
          style={{ width: "200%", height: open ? "640px" : "300px", border: "none", transform: "scale(0.5)", transformOrigin: "top left", pointerEvents: "none" }}
        />
      </button>

      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <strong style={{ fontSize: "0.95rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</strong>
          <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: status === "ready" ? "var(--accent)" : "var(--fg-muted)" }}>{status}</span>
        </div>
        {description && (
          <p style={{ color: "var(--fg-muted)", fontSize: "0.78rem", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {description}
          </p>
        )}
        <span style={{ color: "var(--fg-muted)", fontSize: "0.7rem" }}>
          {new Date(updatedAt).toLocaleDateString()}
        </span>
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "auto", flexWrap: "wrap" }}>
          <button onClick={openFull} className="btn btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}>↗ Open</button>
          <button onClick={download} className="btn btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}>↓ Save</button>
          <button onClick={remove} disabled={deleting} className="btn btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", color: "#fca5a5", marginLeft: "auto" }}>
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
