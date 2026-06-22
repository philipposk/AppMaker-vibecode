"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Edit a saved app: live preview + refine (persists a new iteration) + export.
export default function AppEditor({
  id, name, initialHtml,
}: {
  id: string;
  name: string;
  initialHtml: string;
}) {
  const router = useRouter();
  const [html, setHtml] = useState(initialHtml);
  const [model, setModel] = useState("");
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const refine = async () => {
    if (!refinePrompt.trim()) return;
    setRefining(true); setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: refinePrompt, appId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHtml(data.html);
      setModel(data.model || "");
      if (data.saveError) setError("Refined, but save failed: " + data.saveError);
      setRefinePrompt("");
      router.refresh(); // refresh server history list
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRefining(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${name.replace(/[^\w-]+/g, "_").slice(0, 40) || "app"}.html`;
    a.click();
  };

  const openFull = () => {
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="glass" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem", flex: 1 }}>
          Preview {model && <span style={{ opacity: 0.6 }}>· {model.replace(":free", "")}</span>}
        </span>
        <button onClick={copy} className="btn btn-ghost" style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>
          {copied ? "✓ Copied" : "Copy HTML"}
        </button>
        <button onClick={download} className="btn btn-ghost" style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>↓ Download</button>
        <button onClick={openFull} className="btn btn-ghost" style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>↗ Open</button>
      </div>

      <iframe
        srcDoc={html}
        sandbox="allow-scripts"
        style={{ width: "100%", height: "480px", border: "none", display: "block", background: "#fff" }}
        title={name}
      />

      <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
        <input
          value={refinePrompt}
          onChange={(e) => setRefinePrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") refine(); }}
          placeholder="Refine it… e.g. ‘add a dark/light toggle’"
          style={{ flex: 1, minWidth: "200px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "0.6rem", padding: "0.5rem 0.8rem", color: "var(--fg)", fontSize: "0.85rem", outline: "none" }}
        />
        <button onClick={refine} disabled={refining || !refinePrompt.trim()} className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>
          {refining ? "Refining…" : "↻ Refine"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", color: "#fca5a5", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
