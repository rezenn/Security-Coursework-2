"use client";

interface FilterBarProps {
  filters: readonly string[] | string[];
  activeFilter: string;
  onChange: (filter: string) => void;
  rounded?: "md" | "lg" | "full";
  disabled?: boolean;
}

export default function FilterBar({
  filters,
  activeFilter,
  onChange,
  rounded = "full",
  disabled = false,
}: FilterBarProps) {
  const roundedClasses = {
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => !disabled && onChange(filter)}
          disabled={disabled}
          className={`
            px-4 py-2 text-sm font-medium transition-all duration-200
            ${roundedClasses[rounded]}
            ${
              disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : activeFilter === filter
                  ? "bg-[#B61BE1] text-white shadow-md hover:bg-purple-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
          `}
        >
          {filter.split("\n").map((part, i) => (
            <span key={i}>
              {part}
              {i === 0 && <br />}
            </span>
          ))}
        </button>
      ))}
    </div>
  );
}
