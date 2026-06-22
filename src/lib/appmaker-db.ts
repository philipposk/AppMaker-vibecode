/**
 * Types + helpers for the shared `appmaker` schema (apps + iterations).
 * The schema is owned by the 6x7 platform; this app aligns to it rather than
 * inventing its own tables.
 */

export interface GeneratedCode {
  entry: string;                    // e.g. "index.html"
  files: Record<string, string>;    // filename -> contents
}

export interface AppRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: string;                     // "single-html"
  status: string;                   // "draft" | "ready"
  generated_code: GeneratedCode | Record<string, never>;
  generation: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const APP_TYPE = "single-html";
export const ENTRY_FILE = "index.html";

export function packCode(html: string): GeneratedCode {
  return { entry: ENTRY_FILE, files: { [ENTRY_FILE]: html } };
}

export function unpackCode(code: AppRow["generated_code"] | null | undefined): string {
  if (!code || !("files" in code)) return "";
  const entry = (code as GeneratedCode).entry || ENTRY_FILE;
  return (code as GeneratedCode).files?.[entry] ?? "";
}

/** Derive a short app name from the user's prompt. */
export function deriveName(prompt: string): string {
  const firstLine = prompt.trim().split("\n")[0];
  return firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine || "Untitled app";
}
