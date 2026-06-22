import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AuthButton from "@/components/AuthButton";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AppMaker — Vibe-code web apps with AI",
  description:
    "Describe a web app in plain English, get working HTML/CSS/JS in seconds. Powered by free OpenRouter models.",
  applicationName: "AppMaker",
};

export const viewport: Viewport = {
  themeColor: "#07070a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <nav
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          className="px-6 py-4 flex items-center justify-between"
        >
          <Link href="/" style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.1rem", textDecoration: "none" }}>
            AppMaker
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/my-apps" style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>
              My Apps
            </Link>
            <a href="https://6x7.gr" style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>
              6x7.gr
            </a>
            <AuthButton />
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            color: "var(--fg-muted)",
            fontSize: "0.75rem",
            textAlign: "center",
            padding: "1.5rem",
          }}
        >
          AppMaker · part of{" "}
          <a href="https://6x7.gr" style={{ color: "var(--accent)" }}>
            6x7.gr
          </a>
        </footer>
      </body>
    </html>
  );
}
