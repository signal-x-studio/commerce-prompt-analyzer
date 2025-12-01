import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { CostProvider } from "../context/CostContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commerce Prompt Analyzer",
  description: "Analyze and optimize your e-commerce AEO strategy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-slate-50 min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <CostProvider>
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </CostProvider>
      </body>
    </html>
  );
}
