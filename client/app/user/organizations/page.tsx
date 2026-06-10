"use client";

import { useState } from "react";
import OrganizationsDetailsCard from "../_component/OrganizationDetailCard";
import OrganizationFilter from "../_component/OrganizationFilter";

export default function Organizations() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div>
      <div className="flex flex-row overflow-x-auto pb-5">
        <OrganizationFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      <div className="flex flex-col overflow-y-auto pb-5">
        <OrganizationsDetailsCard activeFilter={activeFilter} />
      </div>
    </div>
  );
}
