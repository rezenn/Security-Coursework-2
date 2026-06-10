import Image from "next/image";
import authImage from "@/app/assets/images/authIllustration.png";
import Hero from "./_components/Hero";
import CredibilitySection from "./_components/CredibilitySection";
import Features from "./_components/Features";
import Usecase from "./_components/Usecase";

export default function Landing() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <Hero />
      <CredibilitySection />
      <Features />
      <Usecase />

    </div>
  );
}
