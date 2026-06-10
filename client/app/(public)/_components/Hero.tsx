import Link from "next/link";
import Image from "next/image";
import calendarImg from "@/app/assets/images/calendarInterface.png";
import InteractiveCalendar from "./InteractiveCalendar";

export default function WaveSection() {
  return (
    <section className="relative w-full max-w-full h-[450px] bg-[#BDD7FE] overflow-x-hidden">
      {/* Foreground Wave */}
      <svg
        className="absolute bottom-0 w-full max-w-full h-100"
        viewBox="0 0 1440 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#B61BE1" // foreground wave color
          d="M0,160L48,144C96,128,192,96,288,101.3C384,107,480,149,576,165.3C672,181,768,171,864,144C960,117,1056,75,1152,69.3C1248,64,1344,96,1392,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      <svg
        className="absolute bottom-0 w-full max-w-full h-100"
        viewBox="0 0 1440 110"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#BBABF7" // foreground wave color
          d="M0,160L48,144C96,128,192,96,288,101.3C384,107,480,149,576,165.3C672,181,768,171,864,144C960,117,1056,75,1152,69.3C1248,64,1344,96,1392,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      {/* Content on top */}
      <div className="relative py-15 z-10 flex flex-row justify-center h-full text-white">
        <div>
          <h1 className="w-xl flex mt-12 text-5xl font-bold text-black/95">
            Smart Booking for Modern Organizations{" "}
          </h1>
          <h3 className="w-xl py-5 text-black/65">
            The product is designed for hospitals, universities, clinics, and
            professional organizations to manage appointment booking,
            departments, time slots and user scheduling.
          </h3>
          <Link
            href="/login"
            className="px-5 py-2 mt-1 text-white inline-flex items-center justify-center rounded-md bg-purple-700 hover:bg-fuchsia-700 hover:rounded-4xl border border-gray-600 shadow-2xl transition-all duration-300 ease-out"
          >
            Get Started
          </Link>
        </div>
        <div className="mx-10"></div>
        <div className="relative flex justify-center items-start group">
          {/* Decorative background card */}
          <div className=" absolute top-4 left-4 h-[315px] w-[370px] rounded-2xl bg-white/80 backdrop-blur-md shadow-xl -rotate-6 transition-all duration-500 ease-out group-hover:-rotate-3 group-hover:scale-105 " />

          {/* Calendar Image */}
          {/* <Image
            src={calendarImg}
            alt="calendar image"
            height={350}
            width={370}
            className=" relative z-10 rounded-xl shadow-2xl transition-all duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110 "
          /> */}
          {/* <div className="relative flex justify-center items-start"> */}
          <InteractiveCalendar />
          {/* </div> */}
        </div>

        {/* <p className="mt-4 text-xl max-w-xl text-center">
          This is a wavy section where you can place any content over the waves.
        </p> */}
      </div>
    </section>
  );
}
