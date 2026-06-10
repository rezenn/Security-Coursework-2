"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function InteractiveCalendar() {
  const [selected, setSelected] = useState<Date | undefined>();

  return (
    <div className=" relative z-10 w-[370px] h-[315px] bg-white rounded-xl shadow-2xl p-4 transition-all duration-500 ease-out group-hover:-rotate-8 group-hover:scale-105 ">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={setSelected}
        className="text-black"
      />
    </div>
  );
}
