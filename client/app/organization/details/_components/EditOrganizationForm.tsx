import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function SimpleEditForm({
  initialData,
  onSave,
  onCancel,
}: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Convert to number, default to 0 if empty or invalid
    const numericValue = value === "" ? 0 : Number(value);
    setFormData({ ...formData, [name]: numericValue });
  };
  const handleWorkingHourChange = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    const updated = [...formData.workingHours];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, workingHours: updated });
  };

  const addDepartment = () => {
    setFormData({
      ...formData,
      departments: [...formData.departments, { name: "", description: "" }],
    });
  };

  const removeDepartment = (index: number) => {
    const updated = formData.departments.filter(
      (_: any, i: number) => i !== index,
    );
    setFormData({ ...formData, departments: updated });
  };

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      timeSlots: [
        ...formData.timeSlots,
        { startTime: "09:00", endTime: "09:30", isAvailable: true },
      ],
    });
  };

  const removeTimeSlot = (index: number) => {
    const updated = formData.timeSlots.filter(
      (_: any, i: number) => i !== index,
    );
    setFormData({ ...formData, timeSlots: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-8">
          {" "}
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Edit Organization
          </h1>
        </div>

        {/* Basic Info */}
        <div className="bg-linear-to-br from-white via-white to-purple-50  shadow-xl rounded-3xl overflow-hidden border border-purple-100 p-5 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>

          <div style={{ marginBottom: "15px" }}>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Organization Type
            </label>
            <select
              name="organizationType"
              value={formData.organizationType}
              onChange={handleChange}
              className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4  py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
            >
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="government_office">Government Office</option>
              <option value="service_center">Service Center</option>
              <option value="bank">Bank</option>
              <option value="school">School</option>
              <option value="college">College</option>
              <option value="university">University</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-linear-to-br from-white via-white to-purple-50  shadow-xl rounded-3xl overflow-hidden border border-purple-100 p-5 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

          <div style={{ marginBottom: "15px" }}>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Street
            </label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-linear-to-br from-white via-white to-purple-50  shadow-xl rounded-3xl overflow-hidden border border-purple-100 p-5 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Phone
              </label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone || ""}
                onChange={handleChange}
                className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-linear-to-br from-white via-white to-purple-50  shadow-xl rounded-3xl overflow-hidden border border-purple-100 p-5 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Working Hours
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "15px",
            }}
          >
            {days.map((day, index) => {
              const hour = formData.workingHours.find(
                (h: any) => h.day === day,
              ) || {
                day,
                openingTime: "09:00",
                closingTime: "17:00",
                isWorking: day !== "saturday",
              };
              const hourIndex = formData.workingHours.findIndex(
                (h: any) => h.day === day,
              );

              return (
                <div
                  key={day}
                  className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-2 py-3.5"
                >
                  <div className="flex justify-between mb-2">
                    <strong>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </strong>
                    <label>
                      <input
                        type="checkbox"
                        checked={hour.isWorking}
                        onChange={(e) => {
                          if (hourIndex >= 0) {
                            handleWorkingHourChange(
                              hourIndex,
                              "isWorking",
                              e.target.checked,
                            );
                          } else {
                            setFormData({
                              ...formData,
                              workingHours: [
                                ...formData.workingHours,
                                {
                                  day,
                                  openingTime: "09:00",
                                  closingTime: "17:00",
                                  isWorking: e.target.checked,
                                },
                              ],
                            });
                          }
                        }}
                      />{" "}
                      Working
                    </label>
                  </div>

                  {hour.isWorking && (
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="time"
                        value={hour.openingTime}
                        onChange={(e) =>
                          hourIndex >= 0 &&
                          handleWorkingHourChange(
                            hourIndex,
                            "openingTime",
                            e.target.value,
                          )
                        }
                        className="py-1 px-2 rounded-md border-gray-200 border-2"
                      />
                      <input
                        type="time"
                        value={hour.closingTime}
                        onChange={(e) =>
                          hourIndex >= 0 &&
                          handleWorkingHourChange(
                            hourIndex,
                            "closingTime",
                            e.target.value,
                          )
                        }
                        className="py-1 px-2 rounded-md border-gray-200 border-2"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Departments */}
        <div className="bg-linear-to-br from-white via-white to-purple-50  shadow-xl rounded-3xl overflow-hidden border border-purple-100 p-5 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Departments
          </h2>

          {formData.departments.map((dept: any, index: number) => (
            <div
              key={index}
              style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
            >
              <input
                type="text"
                placeholder="Department name"
                value={dept.name}
                onChange={(e) => {
                  const updated = [...formData.departments];
                  updated[index] = { ...updated[index], name: e.target.value };
                  setFormData({ ...formData, departments: updated });
                }}
                className="w-2xs bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={dept.description || ""}
                onChange={(e) => {
                  const updated = [...formData.departments];
                  updated[index] = {
                    ...updated[index],
                    description: e.target.value,
                  };
                  setFormData({ ...formData, departments: updated });
                }}
                className="flex flex-2 w-xs bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
              <button
                type="button"
                onClick={() => removeDepartment(index)}
                className="w-12 px-2 py-3 text-white rounded-2xl border-0 bg-red-500 cursor-pointer"
              >
                X
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addDepartment}
            className="px-2 py-3 mt-2 bg-[#62c865] text-white border rounded-2xl cursor-pointer"
          >
            + Add Department
          </button>
        </div>

        {/* Appointment Settings */}
        <div className="bg-linear-to-br from-white via-white to-purple-50  shadow-xl rounded-3xl overflow-hidden border border-purple-100 p-5 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appointment Settings
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="appointmentDuration"
                value={formData.appointmentDuration}
                onChange={handleNumberChange}
                className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Fees (Rs)
              </label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleNumberChange}
                className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Advance Booking (days)
              </label>
              <input
                type="number"
                name="advanceBookingDays"
                value={formData.advanceBookingDays}
                onChange={handleNumberChange}
                className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
              />
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-linear-to-br from-white via-white to-purple-50  shadow-xl rounded-3xl overflow-hidden border border-purple-100 p-5 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Time Slots
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            }}
          >
            {formData.timeSlots.map((slot: any, index: number) => (
              <div
                key={index}
                className="py-3 px-3  rounded-xl border-gray-200 border-2 gap-2 m-2"
              >
                <div className="flex justify-between mb-1">
                  <span>Slot {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="px-2 bg-red-500 text-white font-normal rounded-md cursor-pointer"
                  >
                    X
                  </button>
                </div>
                <div style={{ display: "grid", gap: "5px" }}>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => {
                      const updated = [...formData.timeSlots];
                      updated[index] = {
                        ...updated[index],
                        startTime: e.target.value,
                      };
                      setFormData({ ...formData, timeSlots: updated });
                    }}
                    className="py-1 px-2 rounded-md border-gray-200 border-2"
                  />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => {
                      const updated = [...formData.timeSlots];
                      updated[index] = {
                        ...updated[index],
                        endTime: e.target.value,
                      };
                      setFormData({ ...formData, timeSlots: updated });
                    }}
                    className="py-1 px-2 rounded-md border-gray-200 border-2"
                  />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={slot.isAvailable}
                      onChange={(e) => {
                        const updated = [...formData.timeSlots];
                        updated[index] = {
                          ...updated[index],
                          isAvailable: e.target.checked,
                        };
                        setFormData({ ...formData, timeSlots: updated });
                      }}
                    />{" "}
                    Available
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTimeSlot}
            className="px-2 py-3 mt-2 bg-[#62c865] text-white border rounded-2xl cursor-pointer"
          >
            + Add Time Slot
          </button>
        </div>

        {/* Form Buttons */}
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-3 mt-2 bg-[#ec2b2b] text-white border rounded-2xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-2 py-3 mt-2 bg-[#62c865] text-white border rounded-2xl cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
