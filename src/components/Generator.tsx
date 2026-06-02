"use client";

import { useState, useRef } from "react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generate = async (p = prompt, save = false) => {
    if (!p.trim()) return;
    setLoading(true); setError(""); setHtml(""); setSaved(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, save }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHtml(data.html);
      if (save) setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
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
          <button
            onClick={() => generate(prompt, false)}
            disabled={loading || !prompt.trim()}
            className="btn btn-primary"
          >
            {loading ? "Generating…" : "⚡ Generate"}
          </button>
          {isLoggedIn && html && !saved && (
            <button onClick={() => generate(prompt, true)} className="btn btn-ghost">
              💾 Save
            </button>
          )}
          {saved && <span style={{ color: "var(--accent)", fontSize: "0.9rem" }}>✓ Saved</span>}
          <span style={{ color: "var(--fg-muted)", fontSize: "0.78rem", marginLeft: "auto" }}>
            ⌘↵ to generate
          </span>
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

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", padding: "1rem", color: "#fca5a5", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Output */}
      {html && (
        <div className="glass" style={{ overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
            <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem", flex: 1 }}>Preview</span>
            <button onClick={copy} className="btn btn-ghost" style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>
              {copied ? "✓ Copied" : "Copy HTML"}
            </button>
            <button onClick={download} className="btn btn-ghost" style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}>
              ↓ Download
            </button>
            <button
              onClick={() => {
                if (iframeRef.current) {
                  const w = iframeRef.current.contentWindow?.open("", "_blank");
                  w?.document.write(html); w?.document.close();
                }
              }}
              className="btn btn-ghost"
              style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}
            >
              ↗ Open
            </button>
          </div>
          {/* iframe preview */}
          <iframe
            ref={iframeRef}
            srcDoc={html}
            sandbox="allow-scripts allow-forms"
            style={{ width: "100%", height: "480px", border: "none", display: "block" }}
            title="Generated app preview"
          />
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
