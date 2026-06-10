"use client";

import { useState, useEffect, useMemo } from "react";
import FilterBar from "./FiltersBar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { handleCheckAvailability } from "@/lib/actions/appointment/appointment";
import { toast } from "sonner";
import { FaMoneyBill } from "react-icons/fa";

const generateDates = () => {
  const dates = [];
  const today = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = days[date.getDay()];
    const dayNumber = date.getDate();
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    dates.push({
      display: `${dayName}\n${dayNumber}`,
      fullDate: `${year}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${dayNumber.toString().padStart(2, "0")}`,
      dayName,
      dayNumber,
      month: monthName,
      monthNumber: date.getMonth() + 1,
      year,
    });
  }
  return dates;
};

const DATES = generateDates();

interface Department {
  name: string;
  description?: string;
  _id?: string;
  id?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  _id?: string;
}

interface SimpleTimeSlot {
  time: string;
  isAvailable: boolean;
}

type TimeSlotProp = TimeSlot[] | SimpleTimeSlot[];

interface OrganizationSidebarProps {
  departments: Department[];
  timeSlots: TimeSlotProp;
  organizationId?: string;
  organizationName?: string;
  organizationType?: string;
  fees?: number;
}

export default function OrganizationSidebar({
  departments,
  timeSlots,
  organizationId,
  organizationName,
  organizationType,
  fees,
}: OrganizationSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [filterDate, setFilterDate] = useState(DATES[0]);
  const [filterTimeslot, setFilterTimeslot] = useState<string>("");
  const [isBooking, setIsBooking] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<{
    name: string;
    id: string;
  } | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [departmentMap, setDepartmentMap] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    const map = new Map<string, string>();
    departments.forEach((dept) => {
      const deptId = dept._id || dept.id;
      if (deptId) map.set(dept.name, deptId);
    });
    setDepartmentMap(map);
  }, [departments]);

  const processedTimeSlots = useMemo(() => {
    return (timeSlots || [])
      .map((slot) => {
        if ("time" in slot) {
          const parts = slot.time.split(" - ");
          const startTime = parts[0]?.trim() || "";
          const endTime = parts[1]?.trim() || "";
          if (!startTime || !endTime) return null;
          return {
            startTime,
            endTime,
            isAvailable: slot.isAvailable ?? true,
            display: `${startTime} - ${endTime}`,
          };
        } else {
          const startTime = slot.startTime?.trim() || "";
          const endTime = slot.endTime?.trim() || "";
          if (!startTime || !endTime) return null;
          return {
            startTime,
            endTime,
            isAvailable: slot.isAvailable ?? true,
            display: `${startTime} - ${endTime}`,
          };
        }
      })
      .filter(Boolean) as {
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      display: string;
    }[];
  }, [timeSlots]);

  useEffect(() => {
    if (departments.length > 0 && !filterDepartment) {
      const firstDept = departments[0];
      const deptId = firstDept._id || firstDept.id;
      if (deptId) {
        setFilterDepartment(firstDept.name);
        setSelectedDepartment({ name: firstDept.name, id: deptId });
      }
    }
  }, [departments, filterDepartment]);

  useEffect(() => {
    if (!filterDepartment) return;
    const deptId =
      departmentMap.get(filterDepartment) ||
      departments.find((d) => d.name === filterDepartment)?._id ||
      departments.find((d) => d.name === filterDepartment)?.id;
    if (deptId) setSelectedDepartment({ name: filterDepartment, id: deptId });
  }, [filterDepartment, departmentMap, departments]);

  useEffect(() => {
    const checkAll = async () => {
      if (!selectedDepartment?.id || !filterDate || !organizationId) return;
      if (processedTimeSlots.length === 0) return;

      setIsCheckingAvailability(true);
      setAvailabilityChecked(false);

      const initial: { [key: string]: boolean } = {};
      processedTimeSlots.forEach((slot) => {
        initial[slot.display] = slot.isAvailable;
      });
      setAvailabilityStatus(initial);

      try {
        const updated: { [key: string]: boolean } = {};

        for (const slot of processedTimeSlots) {
          try {
            const result = await handleCheckAvailability({
              organizationId: organizationId!,
              date: filterDate.fullDate,
              startTime: slot.startTime,
              endTime: slot.endTime,
              departmentId: selectedDepartment.id,
            });

            updated[slot.display] =
              result.success && result.data != null
                ? result.data.isAvailable === true
                : slot.isAvailable;
          } catch {
            updated[slot.display] = slot.isAvailable;
          }
        }

        setAvailabilityStatus(updated);
      } catch {
        toast.error("Failed to check slot availability");
        // Keep static fallback
        const fallback: { [key: string]: boolean } = {};
        processedTimeSlots.forEach(
          (s) => (fallback[s.display] = s.isAvailable),
        );
        setAvailabilityStatus(fallback);
      } finally {
        setIsCheckingAvailability(false);
        setAvailabilityChecked(true);
      }
    };

    checkAll();
  }, [selectedDepartment?.id, filterDate.fullDate, organizationId]);

  const availableTimeSlots = useMemo(() => {
    if (!availabilityChecked && Object.keys(availabilityStatus).length === 0) {
      return processedTimeSlots
        .filter((s) => s.isAvailable)
        .map((s) => s.display);
    }
    return processedTimeSlots
      .filter((s) => availabilityStatus[s.display] === true)
      .map((s) => s.display);
  }, [processedTimeSlots, availabilityStatus, availabilityChecked]);

  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      if (!filterTimeslot || !availableTimeSlots.includes(filterTimeslot)) {
        setFilterTimeslot(availableTimeSlots[0]);
      }
    } else if (availabilityChecked) {
      setFilterTimeslot("");
    }
  }, [availableTimeSlots, availabilityChecked]);

  const departmentNames = departments.map((d) => d.name);

  const handleDepartmentChange = (deptName: string) => {
    setFilterDepartment(deptName);
    setAvailabilityStatus({});
    setAvailabilityChecked(false);
    setFilterTimeslot("");
    const deptId = departmentMap.get(deptName);
    if (deptId) setSelectedDepartment({ name: deptName, id: deptId });
  };

  const handleBookAppointment = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/organization/${organizationId}`);
      return;
    }
    if (!filterDepartment) {
      toast.error("Please select a department");
      return;
    }
    if (!filterTimeslot) {
      toast.error("Please select a time slot");
      return;
    }

    const departmentId =
      selectedDepartment?.id ||
      departmentMap.get(filterDepartment) ||
      departments.find((d) => d.name === filterDepartment)?._id ||
      departments.find((d) => d.name === filterDepartment)?.id;

    if (!departmentId) {
      toast.error(
        "Department ID not found. Please try selecting the department again.",
      );
      return;
    }

    const selectedSlot = processedTimeSlots.find(
      (s) => s.display === filterTimeslot,
    );
    if (!selectedSlot) {
      toast.error("Selected time slot not found");
      return;
    }

    setIsBooking(true);

    try {
      const availabilityCheck = await handleCheckAvailability({
        organizationId: organizationId!,
        date: filterDate.fullDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        departmentId,
      });

      if (!availabilityCheck.success || !availabilityCheck.data?.isAvailable) {
        toast.error(
          availabilityCheck.message || "This time slot is no longer available",
        );
        setAvailabilityStatus((prev) => ({
          ...prev,
          [selectedSlot.display]: false,
        }));
        setIsBooking(false);
        return;
      }

      const bookingData = {
        organizationId,
        organizationName,
        organizationType,
        fees: fees || 0,
        department: { name: filterDepartment, id: departmentId },
        date: {
          display: filterDate.display,
          fullDate: filterDate.fullDate,
          dayName: filterDate.dayName,
          dayNumber: filterDate.dayNumber,
          month: filterDate.month,
          year: filterDate.year,
        },
        timeSlot: {
          display: filterTimeslot,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        },
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
        bookingTime: new Date().toISOString(),
      };

      sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
      router.push("/user/appointment");
    } catch {
      toast.error("Failed to process booking");
      setIsBooking(false);
    }
  };

  if (departments.length === 0 && processedTimeSlots.length === 0) {
    return (
      <div className="flex flex-col justify-start p-4 bg-white rounded-xl shadow-lg">
        <p className="text-gray-500 text-center">
          No departments or time slots available
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-start bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {departments.length > 0 && (
        <>
          <h1 className="py-2 font-bold text-2xl text-gray-800">Departments</h1>
          <FilterBar
            filters={departmentNames}
            activeFilter={filterDepartment}
            onChange={handleDepartmentChange}
          />
          <div className="mt-3 h-px w-full bg-gray-400" />
        </>
      )}

      <h2 className="py-2 font-bold text-xl text-gray-800">Available Slots</h2>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Select Date for {filterDate.month}
          </h3>
          <FilterBar
            rounded="lg"
            filters={DATES.map((d) => d.display)}
            activeFilter={filterDate.display}
            onChange={(selected) => {
              const obj = DATES.find((d) => d.display === selected);
              if (obj) {
                setFilterDate(obj);
                setAvailabilityStatus({});
                setAvailabilityChecked(false);
                setFilterTimeslot("");
              }
            }}
          />
        </div>

        {processedTimeSlots.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              Select Time
              {isCheckingAvailability && (
                <span className="inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              )}
            </h3>

            {/* Skeleton while first check runs */}
            {isCheckingAvailability && availableTimeSlots.length === 0 ? (
              <div className="flex gap-2 flex-wrap">
                {processedTimeSlots.map((_, i) => (
                  <div
                    key={i}
                    className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <FilterBar
                filters={
                  availableTimeSlots.length > 0
                    ? availableTimeSlots
                    : ["No slots available"]
                }
                activeFilter={
                  availableTimeSlots.includes(filterTimeslot)
                    ? filterTimeslot
                    : availableTimeSlots[0] || ""
                }
                onChange={setFilterTimeslot}
                disabled={
                  availableTimeSlots.length === 0 || isCheckingAvailability
                }
              />
            )}

            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{availableTimeSlots.length}</span>{" "}
              of{" "}
              <span className="font-medium">{processedTimeSlots.length}</span>{" "}
              slots available
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 h-px w-full bg-gray-400" />

      <div className="mt-1 text-sm text-gray-600">
        <h2 className="py-2 font-bold text-xl text-gray-800">
          Appointment Fees
        </h2>
        <div className="flex items-center">
          <FaMoneyBill className="text-green-600 mr-2" />
          <span className="font-medium">Rs {fees}</span>
        </div>
      </div>

      {(filterDepartment || filterTimeslot) && (
        <div className="mt-6 p-3 bg-fuchsia-50 rounded-lg">
          <h3 className="font-semibold text-[#B61BE1] mb-2">Your Selection</h3>
          {filterDepartment && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Department: </span>
              {filterDepartment}
            </p>
          )}
          {filterDate && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Date: </span>
              {filterDate.display.replace("\n", " ")}, {filterDate.month}
            </p>
          )}
          {filterTimeslot && availableTimeSlots.length > 0 && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Time: </span>
              {filterTimeslot}
            </p>
          )}
        </div>
      )}

      <div className="my-5 flex items-center justify-center">
        <button
          onClick={handleBookAppointment}
          disabled={
            isBooking ||
            isCheckingAvailability ||
            !filterDepartment ||
            !filterTimeslot ||
            availableTimeSlots.length === 0
          }
          className="flex-1 bg-[#B61BE1] text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isBooking ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : isCheckingAvailability ? (
            "Checking Availability..."
          ) : (
            "Book an Appointment"
          )}
        </button>
      </div>
    </div>
  );
}
