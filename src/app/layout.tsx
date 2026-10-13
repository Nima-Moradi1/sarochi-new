import type { Metadata } from "next";
import "./globals.css";
import { getBrandIdentity } from "@/features/content/server/repository";
import type { BrandIdentity } from "@/features/content/brand-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ساروچی | آتلیه زنده",
  description: "تجربه تازه پوشاک مردانه ساروچی",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let identity: BrandIdentity = {};
  try { identity = await getBrandIdentity(); } catch { /* Preserve the accessible shell during DB outages. */ }
  return <html lang="fa" dir="rtl" data-theme={identity.theme ?? "PORCELAIN"} data-typography={identity.typography ?? "VAZIRMATN"}><body className="min-h-screen antialiased">{children}</body></html>;
}
