"use server";
import { revalidatePath } from "next/cache";
import {
  register,
  login,
  updateProfile,
  getUser,
  requestPasswordReset,
  resetPassword,
} from "../api/auth";
import { setAuthToken, setUserData } from "../cookie";

export async function handleRegister(resgistrationData: any) {
  try {
    const result = await register(resgistrationData);
    if (result.success) {
      return {
        success: true,
        message: "Register successful",
        data: result.data,
      };
    }
    return {
      success: false,
      message: result?.message || "Registration failed",
    };
  } catch (error: Error | any) {
    return { success: false, message: error.message };
  }
}

export async function handleLogin(loginData: any) {
  try {
    const result = await login(loginData);
    if (result.success) {
      await setAuthToken(result.token);
      setUserData(result.data);
      return {
        success: true,
        message: "login successful",
        data: result.data,
      };
    }
    return { success: false, message: result.message || "Login failed" };
  } catch (error: Error | any) {
    return { success: false, message: error.message };
  }
}

export async function handleGetUser() {
  try {
    const result = await getUser();
    if (result.success) {
      return {
        success: true,
        message: "user data fetch successful",
        data: result.data,
      };
    }
    return {
      success: false,
      message: result.message || "user data fetch failed",
    };
  } catch (err: Error | any) {
    return { success: false, message: err.message };
  }
}

export async function handleUpdateProfile(profileData: any) {
  try {
    const result = await updateProfile(profileData);

    if (result.success) {
      const userData = {
        _id: result.data._id,
        fullName: result.data.fullName,
        email: result.data.email,
        phoneNumber: result.data.phoneNumber,
        role: result.data.role,
        profilePicture: result.data.profilePicture,
        imageUrl: result.data.imageUrl,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      };

      // Store in cookies
      await setUserData(userData);

      // Revalidate paths
      revalidatePath("/user/profile");
      revalidatePath("/user/dashboard");

      return {
        success: true,
        message: "Profile updated successfully",
        data: userData,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update profile",
    };
  } catch (error: Error | any) {
    console.error("Update profile error:", error);
    return { success: false, message: error.message };
  }
}

export const handleRequestPasswordReset = async (email: string) => {
  try {
    const response = await requestPasswordReset(email);
    if (response.success) {
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    }
    return {
      success: false,
      message: response.message || "Request password reset failed",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Request password reset action failed",
    };
  }
};

export const handleResetPassword = async (
  token: string,
  newPassword: string,
) => {
  try {
    const response = await resetPassword(token, newPassword);
    if (response.success) {
      return {
        success: true,
        message: "Password has been reset successfully",
      };
    }
    return {
      success: false,
      message: response.message || "Reset password failed",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Reset password action failed",
    };
  }
};
