import Image from "next/image";
import authImage from "@/app/assets/images/authIllustration.png";
import localFont from "next/font/local";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import { ThemeProvider } from "next-themes";

const k2d = localFont({
  src: [{ path: "../assets/fonts/K2D/K2D-Bold.woff2", weight: "700" }],
  variable: "--font-k2d",
  display: "swap",
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section
      className={`min-h-screen w-screen flex flex-col ${k2d.className}`}
      style={{
        background: `
          linear-gradient(
            to bottom,
            #BDDCFF 0%,
            #BCC2FB 13%,
            #BA7BF0 50%,
            #BBA7F6 78%,
            #BCC2FB 100%
          )
        `,
      }}
    >
      <Header />

      <div className={`${k2d.className}`}>{children}</div>
      <Footer />
    </section>
  );
}
