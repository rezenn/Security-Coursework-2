import axiosInstance from "@/lib/api/axios";
import { API } from "./endpoints";

export const register = async (registerData: any) => {
  try {
    const response = await axiosInstance.post(API.AUTH.REGISTER, registerData);

    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message || error.message || "Registration failed",
    );
  }
};

export const login = async (loginData: any) => {
  try {
    const response = await axiosInstance.post(API.AUTH.LOGIN, loginData);
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message || error.message || "Login failed",
    );
  }
};

export const getUser = async () => {
  try {
    const response = await axiosInstance.get(API.AUTH.GETUSER);
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch user",
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

export const updateProfile = async (profileData: any) => {
  try {
    const response = await axiosInstance.put(
      API.AUTH.UPDATEPROFILE,
      profileData,
      {
        headers: {
          "Content-Type": "multipart/form-data", //for file upload
        },
      },
    );
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "update profile not found ",
    );
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    const response = await axiosInstance.post(API.AUTH.REQUEST_PASSWORD_RESET, {
      email,
    });
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Request password reset failed",
    );
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await axiosInstance.post(API.AUTH.RESET_PASSWORD(token), {
      newPassword: newPassword,
    });
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message || error.message || "Reset password failed",
    );
  }
};
