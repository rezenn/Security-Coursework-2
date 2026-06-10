"use server";

import { revalidatePath } from "next/cache";
import {
  getOrganizationById,
  getAllOrganizations,
  postOrganizationDetails,
  deleteOrganizationDetails,
  updateOrganizationDetails,
  getMyOrganizationDetails,
} from "@/lib/api/organization/organization";
import { OrganizationData } from "@/types/organization.types";

export async function handleGetAllOrganizations() {
  try {
    const response = await getAllOrganizations();
    return {
      success: true,
      message: response.message,
      data: response.data,
    };
  } catch (err: Error | any) {
    return { success: false, message: err.message, data: [] };
  }
}
export async function handleGetOrganizationById(organizationId: string) {
  try {
    const response = await getOrganizationById(organizationId);
    return {
      success: true,
      message: response.message,
      data: response.data,
    };
  } catch (err: Error | any) {
    return { success: false, message: err.message };
  }
}

export async function handlePostOrganizationDetails(
  organizationData: Partial<OrganizationData>,
) {
  try {
    const response = await postOrganizationDetails(organizationData);
    if (response.success) {
      revalidatePath("/organizations");
      revalidatePath("/dashboard/organization");
      revalidatePath("/organization/details");

      return {
        success: true,
        message: "organization data posted successfully",
        data: response.data,
      };
    }
    return {
      success: false,
      message: response.message || "organization data post failed",
      data: response.data,
    };
  } catch (err: Error | any) {
    return { success: false, message: err.message };
  }
}
export async function handleGetMyOrganizationDetails() {
  try {
    const response = await getMyOrganizationDetails();
    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
      data: null,
    };
  }
}
export async function handleUpdateOrganizationDetails(
  organizationData: Partial<OrganizationData>,
) {
  try {
    const response = await updateOrganizationDetails(organizationData);
    if (response.success) {
      revalidatePath("/organizations");
      revalidatePath("/dashboard/organization");
    }
    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
      data: null,
    };
  }
}

export async function handleDeleteOrganizationDetails() {
  try {
    const response = await deleteOrganizationDetails();
    if (response.success) {
      revalidatePath("/organizations");
      revalidatePath("/dashboard/organization");
    }
    return {
      success: response.success,
      message: response.message,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
    };
  }
}
