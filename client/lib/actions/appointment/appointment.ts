"use server";

import { revalidatePath } from "next/cache";
import {
  createAppointment,
  checkAvailability,
  getUserAppointments,
  cancelAppointment,
  completeAppointment,
  getAllAppointments,
  getAppointmentById,
  getOrganizationAppointments,
} from "@/lib/api/appointment/appointment";
import { cookies } from "next/headers";

export async function handleCreateAppointment(formData: FormData) {
  try {
    const appointmentData = {
      organizationId: formData.get("organizationId") as string,
      departmentId: formData.get("departmentId") as string,
      date: formData.get("date") as string,
      timeslot: {
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
      },
      clientName: formData.get("clientName") as string,
      clientEmail: formData.get("clientEmail") as string,
      clientPhoneNumber: formData.get("clientPhoneNumber") as string,
      notes: formData.get("notes") as string,
    };
    const result = await createAppointment(appointmentData);

    if (result.success) {
      revalidatePath("/user/appointments");
      return {
        success: true,
        message: "Appointment created successfully",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to create appointment",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to create appointment",
    };
  }
}

export async function handleCheckAvailability(data: {
  organizationId: string;
  date: string;
  startTime: string;
  endTime: string;
  departmentId?: string;
}) {
  try {
    if (
      !data.organizationId ||
      !data.date ||
      !data.startTime ||
      !data.endTime
    ) {
      return {
        success: false,
        message: "Missing required fields for availability check",
      };
    }
    const result = await checkAvailability(data);

    return result;
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to check availability",
    };
  }
}

export async function handleGetUserAppointments() {
  try {
    const result = await getUserAppointments();
    return result;
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to fetch appointments",
    };
  }
}

export async function handleCancelAppointment(appointmentId: string) {
  try {
    const result = await cancelAppointment(appointmentId);

    if (result.success) {
      revalidatePath("/user/appointments");
      return {
        success: true,
        message: "Appointment cancelled successfully",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to cancel appointment",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to cancel appointment",
    };
  }
}
export async function handleCompleteAppointment(appointmentId: string) {
  try {
    const result = await completeAppointment(appointmentId);

    if (result.success) {
      revalidatePath("/user/appointments");
      return {
        success: true,
        message: "Appointment completed successfully",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to complete appointment",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to complete appointment",
    };
  }
}

export async function handleGetAllAppointments() {
  try {
    const result = await getAllAppointments();
    if (result.success) {
      revalidatePath("/user/appointments");

      return {
        success: true,
        message: "Appointments fetched successfully",
        data: result.data,
      };
    }
    return {
      success: false,
      message: result.message || "Failed to fetch appointments",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to fetch appointments",
    };
  }
}
export async function handleGetOrganizationAppointments(
  organizationId: string,
) {
  try {
    const result = await getOrganizationAppointments(organizationId);
    if (result.success) {
      return {
        success: true,
        message: "Appointments fetched successfully",
        data: result.data,
      };
    }
    return {
      success: false,
      message: result.message || "Failed to fetch appointments",
      data: [],
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to fetch appointments",
      data: [],
    };
  }
}
export async function handleGetAppointment(appointmentId: string) {
  try {
    const result = await getAppointmentById(appointmentId);
    if (result.success) {
      revalidatePath("/user/appointments");

      return {
        success: true,
        message: "Appointment fetched successfully",
        data: result.data,
      };
    }
    return {
      success: false,
      message: result.message || "Failed to fetch appointment",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to fetch appointment",
    };
  }
}
