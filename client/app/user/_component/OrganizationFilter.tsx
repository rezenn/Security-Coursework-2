"use client";

import FiltersBar from "./FiltersBar";

const orgFilters = [
  "All",
  "Hospital",
  "Clinic",
  "Government Office",
  "Service Center",
  "Bank",
  "School",
  "College",
  "University",
  "Others",
];

interface OrganizationFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function OrganizationFilter({
  activeFilter,
  onFilterChange,
}: OrganizationFilterProps) {
  return (
    <FiltersBar
      filters={orgFilters}
      activeFilter={activeFilter}
      onChange={onFilterChange}
    />
  );
}
