"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const EXAMPLES = [
  "A pomodoro timer with sessions counter",
  "A tip calculator with split among friends",
  "A random password generator with strength meter",
  "A dark/light mode toggle button demo",
  "A simple budget tracker with localStorage",
];

export default function Generator({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState("");
  const [model, setModel] = useState("");
  const [appId, setAppId] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fresh generation. save=true creates an `apps` row (and returns its id).
  const generate = async (p = prompt, save = false) => {
    if (!p.trim()) return;
    setLoading(true); setError(""); setHtml(""); setSaved(false); setAppId(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, save }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHtml(data.html);
      setModel(data.model || "");
      if (data.appId) setAppId(data.appId);
      if (save) {
        if (data.saveError) setError("Generated, but save failed: " + data.saveError);
        else setSaved(true);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Refine an already-saved app (requires appId). Persists a new iteration.
  const refine = async () => {
    if (!refinePrompt.trim() || !appId) return;
    setRefining(true); setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: refinePrompt, appId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHtml(data.html);
      setModel(data.model || "");
      if (data.saveError) setError("Refined, but save failed: " + data.saveError);
      setRefinePrompt("");
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
    a.download = "app.html";
    a.click();
  };

  const openFull = () => {
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div>
      {/* Input */}
      <div className="glass" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
          placeholder="Describe the app you want to build…"
          rows={3}
          style={{
            width: "100%", resize: "vertical", background: "transparent",
            border: "none", outline: "none", color: "var(--fg)",
            fontSize: "1rem", lineHeight: 1.6, fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => generate(prompt, false)} disabled={loading || !prompt.trim()} className="btn btn-primary">
            {loading ? "Generating…" : "⚡ Generate"}
          </button>
          {isLoggedIn && html && !saved && !appId && (
            <button onClick={() => generate(prompt, true)} disabled={loading} className="btn btn-ghost">💾 Save</button>
          )}
          {saved && (
            <span style={{ color: "var(--accent)", fontSize: "0.9rem" }}>
              ✓ Saved · <Link href="/my-apps" style={{ color: "var(--accent)", textDecoration: "underline" }}>My Apps</Link>
            </span>
          )}
          {!isLoggedIn && html && (
            <Link href="/auth/sign-in" style={{ color: "var(--fg-muted)", fontSize: "0.82rem" }}>Sign in to save & refine →</Link>
          )}
          <span style={{ color: "var(--fg-muted)", fontSize: "0.78rem", marginLeft: "auto" }}>⌘↵ to generate</span>
        </div>
      </div>

      {/* Examples */}
      {!html && !loading && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setPrompt(ex); generate(ex); }}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                borderRadius: "9999px", padding: "0.4rem 1rem", color: "var(--fg-muted)",
                fontSize: "0.8rem", cursor: "pointer",
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="glass" style={{ padding: "2rem", textAlign: "center", color: "var(--fg-muted)", marginBottom: "1rem" }}>
          Building your app… trying the best free model available.
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", padding: "1rem", color: "#fca5a5", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Output */}
      {html && (
        <div className="glass" style={{ overflow: "hidden" }}>
          {/* Toolbar */}
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
          {/* iframe preview — allow-scripts WITHOUT allow-same-origin keeps it in
              an opaque origin: generated code runs but cannot touch the parent. */}
          <iframe
            ref={iframeRef}
            srcDoc={html}
            sandbox="allow-scripts"
            style={{ width: "100%", height: "480px", border: "none", display: "block", background: "#fff" }}
            title="Generated app preview"
          />

          {/* Refine box (only for saved apps) */}
          {appId && (
            <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              <input
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") refine(); }}
                placeholder="Refine it… e.g. ‘make the buttons bigger and add a reset’"
                style={{ flex: 1, minWidth: "200px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "0.6rem", padding: "0.5rem 0.8rem", color: "var(--fg)", fontSize: "0.85rem", outline: "none" }}
              />
              <button onClick={refine} disabled={refining || !refinePrompt.trim()} className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>
                {refining ? "Refining…" : "↻ Refine"}
              </button>
            </div>
          )}

          {/* Raw code toggle */}
          <details style={{ borderTop: "1px solid var(--border)" }}>
            <summary style={{ padding: "0.75rem 1rem", cursor: "pointer", color: "var(--fg-muted)", fontSize: "0.8rem" }}>
              View source HTML
            </summary>
            <pre style={{ margin: 0, padding: "1rem", overflowX: "auto", fontSize: "0.78rem", color: "var(--fg-muted)", maxHeight: "320px", overflowY: "auto" }}>
              <code>{html}</code>
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
