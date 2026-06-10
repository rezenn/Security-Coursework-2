import axiosInstance from "../axios";
import { API } from "../endpoints";

export interface CreateAppointmentData {
  organizationId: string;
  departmentId: string;
  date: string;
  timeslot: {
    startTime: string;
    endTime: string;
  };
  clientName?: string;
  clientEmail?: string;
  clientPhoneNumber?: string;
  notes?: string;
  paymentMethod?: "online" | "cash";
  paymentAmount?: number;
}

export interface CheckAvailabilityData {
  organizationId: string;
  date: string;
  startTime: string;
  endTime: string;
  departmentId?: string;
}

export const createAppointment = async (
  appointmentData: CreateAppointmentData,
) => {
  try {
    const response = await axiosInstance.post(
      API.APPOINTMENT.CREATE,
      appointmentData,
    );
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to create appointment",
    );
  }
};

export const createPaymentIntent = async (
  amount: number,
  appointmentId?: string,
): Promise<string> => {
  try {
    const response = await axiosInstance.post(
      "/api/payments/create-payment-intent",
      {
        amount,
        currency: "npr",
        ...(appointmentId ? { appointmentId } : {}),
      },
    );
    return response.data.data.clientSecret;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message || "Failed to create payment intent",
    );
  }
};

export const markAppointmentPaid = async (
  appointmentId: string,
): Promise<void> => {
  try {
    await axiosInstance.patch(`/api/payments/${appointmentId}/mark-paid`);
  } catch (error: Error | any) {
    console.error("Failed to mark appointment paid:", error.message);
  }
};

export const checkAvailability = async (data: CheckAvailabilityData) => {
  try {
    if (!API.APPOINTMENT?.CHECKAVAILABILITY) {
      throw new Error("CHECKAVAILABILITY endpoint is not defined");
    }
    const params = new URLSearchParams({
      organizationId: data.organizationId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    });
    if (data.departmentId) params.append("departmentId", data.departmentId);

    const response = await axiosInstance.get(
      `${API.APPOINTMENT.CHECKAVAILABILITY}?${params}`,
    );
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to check availability",
    );
  }
};

export const getUserAppointments = async () => {
  try {
    const response = await axiosInstance.get(
      API.APPOINTMENT.GETUSERAPPOINTMENT,
    );
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch user appointments",
    );
  }
};

export const getAppointmentById = async (id: string) => {
  try {
    const response = await axiosInstance.get(API.APPOINTMENT.GETBYID(id));
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch appointment",
    );
  }
};

export const cancelAppointment = async (id: string) => {
  try {
    const response = await axiosInstance.patch(API.APPOINTMENT.CANCEL(id));
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to cancel appointment",
    );
  }
};

export const completeAppointment = async (id: string) => {
  try {
    const response = await axiosInstance.patch(API.APPOINTMENT.COMPLETE(id));
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to complete appointment",
    );
  }
};

export const getAllAppointments = async () => {
  try {
    const response = await axiosInstance.get(API.APPOINTMENT.GETALL);
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch all appointments",
    );
  }
};

export const getOrganizationAppointments = async (organizationId: string) => {
  try {
    const response = await axiosInstance.get(
      API.APPOINTMENT.GETBYORGANIZATION(organizationId),
    );
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch organization appointments",
    );
  }
};
