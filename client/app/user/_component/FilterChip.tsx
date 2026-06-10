"use client";

type FilterChipProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  rounded?: "full" | "lg";
};

export default function FilterChip({
  label,
  isActive,
  onClick,
  size = "md",
  rounded = "full",
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 font-medium transition-all duration-200
        ${rounded === "lg" ? "rounded-lg" : "rounded-full"}
        ${size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-3 text-sm"}
        ${
          isActive
            ? "bg-gray-700 text-white"
            : "bg-gray-300 text-gray-700 hover:bg-gray-400"
        }`}
    >
      {label.split("\n").map((line, index) => (
        <span key={index} className="block leading-tight">
          {line}
        </span>
      ))}{" "}
    </button>
  );
}
