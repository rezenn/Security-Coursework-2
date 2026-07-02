import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore
import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GyanKosh — Learn Securely",
  description: "A secure online learning platform",
  icons: {
    icon: [{ url: "/images/logo.jpg", sizes: "32x32",  type: "image/jpg" }],
    apple: [{ url: "/images/logo.jpg", sizes: "180x180", type: "image/jpg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
