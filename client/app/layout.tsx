import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
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
