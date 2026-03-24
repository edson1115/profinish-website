import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { ThemeSwitcher } from "@/components/theme-switcher";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Profinish - Premium Auto Network",
  description: "B2B dispatch and coordination network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-navy-900 text-white flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="flex-1 flex flex-col">
            {children}
          </main>

          {/* Global Footer with Disclaimer (Hidden when printing invoices) */}
          <footer className="w-full flex flex-col items-center justify-center border-t border-white/10 mt-auto text-center text-xs gap-6 py-12 text-gray-500 print:hidden">
            <div className="max-w-3xl px-6 text-justify">
              <p className="font-bold text-gray-400 mb-2 uppercase tracking-wider text-center">Service Fulfillment Disclaimer</p>
              <p>Profinish operates as a premium B2B dispatch and coordination network. All physical repair, calibration, and detailing services are fulfilled by our exclusive network of certified, independent partner facilities.</p>
            </div>
            <div className="flex items-center gap-8 text-gray-400">
              <p>
                &copy; 2026 Profinish. All rights reserved.
              </p>
              <ThemeSwitcher />
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
