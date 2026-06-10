"use server";

import { revalidatePath } from "next/cache";
import {
  sendMessageToOrganization,
  getStreamToken,
} from "@/lib/api/message/message";

export async function handleSendMessageToOrganization(
  orgUserId: string,
  message: string,
) {
  try {
    const result = await sendMessageToOrganization(orgUserId, message);

    if (result.success) {
      revalidatePath("/chat");
      revalidatePath("/organizations");
      return {
        success: true,
        message: "Message sent successfully",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to send message",
    };
  } catch (err: Error | any) {
    console.error("Send message action error:", err);
    return {
      success: false,
      message: err.message || "Failed to send message",
    };
  }
}

export async function handleGetStreamToken(userId: string) {
  try {
    const result = await getStreamToken(userId);

    if (result.success) {
      return {
        success: true,
        message: "Stream token fetched successfully",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to get stream token",
    };
  } catch (err: Error | any) {
    console.error("Get stream token action error:", err);
    return {
      success: false,
      message: err.message || "Failed to get stream token",
    };
  }
}
