import axiosInstance from "@/lib/api/axios";
import { API } from "../endpoints";

export interface StreamTokenResponse {
  success: boolean;
  data: {
    apiKey: string;
    token: string;
    userId: string;
    user: {
      id: string;
      name: string;
      image?: string;
      role: string;
    };
  };
  message?: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    channelId: string;
    message: any;
  };
  members?: string[];
  message?: string;
}

export const getStreamToken = async (
  userId: string,
): Promise<StreamTokenResponse> => {
  try {
    const response = await axiosInstance.post(API.MESSAGE.STREAMTOKEN, {
      userId,
    });
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to get stream token",
    );
  }
};

export const sendMessageToOrganization = async (
  orgUserId: string,
  message: string,
): Promise<SendMessageResponse> => {
  try {
    const response = await axiosInstance.post(API.MESSAGE.SENDTOORG, {
      orgUserId,
      message,
    });
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to send message",
    );
  }
};
