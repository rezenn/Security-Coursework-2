// types/organization.types.ts
export type OrganizationType =
  | "hospital"
  | "clinic"
  | "government_office"
  | "service_center"
  | "bank"
  | "school"
  | "college"
  | "university"
  | "others";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WorkingHour {
  day: DayOfWeek;
  openingTime: string;
  closingTime: string;
  isWorking: boolean;
  _id?: string;
}

export interface Department {
  name: string;
  description?: string;
  _id?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  _id?: string;
}

export interface UserInfo {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  profilePicture?: string;
}

export interface OrganizationData {
  _id: string;
  userId?: string;
  organizationName: string;
  organizationType: OrganizationType;
  description?: string;
  street: string;
  city: string;
  state?: string;
  contactEmail: string;
  contactPhone?: string;
  workingHours: WorkingHour[];
  departments: Department[];
  fees: number;
  appointmentDuration: number;
  advanceBookingDays: number;
  timeSlots: TimeSlot[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: UserInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
