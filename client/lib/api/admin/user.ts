import axiosInstance from "@/lib/api/axios";
import { API } from "../endpoints";

export const createUser = async (profileData: any) => {
  try {
    const response = await axiosInstance.post(
      API.ADMIN.CREATEUSER,
      profileData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "new user not created",
    );
  }
};
export const createOrganization = async (profileData: any) => {
  try {
    const response = await axiosInstance.post(
      API.ADMIN.REGISTERORGANIZATION,
      profileData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "new user not created",
    );
  }
};

export const updateUserAsAdmin = async (userId: string, userData: FormData) => {
  try {
    const response = await axiosInstance.put(
      API.ADMIN.UPDATEUSERASADMIN(userId),
      userData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to update user",
    );
  }
};

export const deleteUser = async (id: string) => {
  try {
    const response = await axiosInstance.delete(
      API.ADMIN.DELETEUSERASADMIN(id),
    );
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to delete user",
    );
  }
};

export const getAllUsers = async (
  page: number,
  size: number,
  search?: string,
  role?: string,
) => {
  try {
    const response = await axiosInstance.get(API.ADMIN.GETALLUSERS, {
      params: { page, size, search, role },
    });
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch users",
    );
  }
};
export const getOneUser = async (userId: string) => {
  try {
    const response = await axiosInstance.get(API.ADMIN.GETUSERBYID(userId));
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch user",
    );
  }
};
