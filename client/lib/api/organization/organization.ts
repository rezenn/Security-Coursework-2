import axiosInstance from "@/lib/api/axios";
import { API } from "../endpoints";
import { OrganizationData, ApiResponse } from "@/types/organization.types";

export const postOrganizationDetails = async (
  organizationDetail: Partial<OrganizationData>,
): Promise<ApiResponse<OrganizationData>> => {
  try {
    const response = await axiosInstance.post(
      API.ORGANIZATION.POSTORGANIZATIONDETAILS,
      organizationDetail,
    );
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Organization data post failed",
    );
  }
};

export const getAllOrganizations = async (): Promise<
  ApiResponse<OrganizationData[]>
> => {
  try {
    const response = await axiosInstance.get(API.ORGANIZATION.GETORGANIZATIONS);
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to fetch organizations",
    );
  }
};
export const getMyOrganizationDetails = async (): Promise<
  ApiResponse<OrganizationData>
> => {
  try {
    const response = await axiosInstance.get(
      API.ORGANIZATION.GETORGANIZATIONDETAILS,
    );
    return response.data;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to fetch organization details",
    );
  }
};
export const getOrganizationById = async (
  organizationId: string,
): Promise<ApiResponse<OrganizationData>> => {
  try {
    const response = await axiosInstance.get(
      API.ORGANIZATION.GETORGANIZATIONBYID(organizationId),
    );
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to fetch organization",
    );
  }
};
export const updateOrganizationDetails = async (
  organizationDetail: Partial<OrganizationData>,
): Promise<ApiResponse<OrganizationData>> => {
  try {
    const response = await axiosInstance.put(
      API.ORGANIZATION.UPDATEORGANIZATIONDETAILS,
      organizationDetail,
    );
    return response.data;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Organization data update failed",
    );
  }
};

export const deleteOrganizationDetails = async (): Promise<
  ApiResponse<null>
> => {
  try {
    const response = await axiosInstance.delete(
      API.ORGANIZATION.DELETEORGANIZATIONDETAILS,
    );
    return response.data;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Organization data delete failed",
    );
  }
};
