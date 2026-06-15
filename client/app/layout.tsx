import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/app/hooks/useAuth";
import { ThemeProvider } from "next-themes";

const poppins = localFont({
  src: [{ path: "./assets/fonts/Poppins/Poppins-Regular.woff2" }],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GyanKosh — Secure Academic Marketplace",
  description: "Securely share and discover academic resources",
  icons: {
    icon: "/icons/icon.png",
    apple: "/icons/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`}>
        {/* reCAPTCHA v3 — badge is visible bottom-right on every auth page */}
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            strategy="afterInteractive"
          />
        )}
        <ThemeProvider attribute="class" enableSystem>
          <AuthProvider>
            {children}
            <Toaster richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
