"use client";
import localFont from "next/font/local";

const poppins = localFont({
  src: [{ path: "../assets/fonts/Poppins/Poppins-Regular.woff2" }],
  variable: "--font-poppins",
  display: "swap",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section
      className={`min-h-screen w-screen flex items-center justify-center ${poppins.className}`}
      style={{
        background:
          "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
      }}
    >
      {children}
    </section>
  );
}
