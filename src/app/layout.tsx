import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "OutreachPro",
  description: "WhatsApp A/B outreach system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="bottom-right" toastOptions={{
          style: { background: "#1C2230", color: "#E8EAF0", border: "1px solid rgba(255,255,255,0.1)", fontSize: "13px" },
          success: { iconTheme: { primary: "#4ADE80", secondary: "#0C0F14" } },
          error: { iconTheme: { primary: "#F87171", secondary: "#0C0F14" } },
        }} />
      </body>
    </html>
  );
}
