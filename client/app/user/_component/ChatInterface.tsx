"use client";

import { useEffect, useState, useRef } from "react";
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import { getAuthToken } from "@/lib/auth-utils";

import "stream-chat-react/dist/css/v2/index.css";

interface ChatInterfaceProps {
  userId: string;
  userName: string;
  userImage?: string;
}

let globalClient: StreamChat | null = null;

export default function ChatInterface({
  userId,
  userName,
  userImage,
}: ChatInterfaceProps) {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const initChat = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          setError("No authentication token found");
          return;
        }

        const res = await fetch(
          "http://localhost:5050/api/message/stream-token",
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result = await res.json();
        if (!result.success) {
          throw new Error(result.message || "Failed to get Stream token");
        }

        const { apiKey, token } = result.data;
        globalClient = StreamChat.getInstance(apiKey);

        if (!globalClient.user) {
          await globalClient.connectUser(
            {
              id: userId,
              name: userName,
              image: userImage,
            },
            token,
          );
        }

        setChatClient(globalClient);
        setError(null);
      } catch (error: any) {
        console.error("Failed to initialize chat:", error);
        setError(error.message || "Failed to initialize chat");
      }
    };

    initChat();
  }, [userId, userName, userImage]);

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-red-800">
        <h3 className="font-bold text-lg mb-2">Chat Error</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!chatClient) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        Loading chat...
      </div>
    );
  }

  const filters = {
    type: "messaging",
    members: { $in: [userId] },
  };

  return (
    <div className="h-[550px] mt-5  bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100">
      <Chat client={chatClient} theme="messaging light">
        <div className="flex h-full">
          <div className="w-1/3 border-r border-gray-200 bg-white">
            <ChannelList
              filters={filters}
              sort={{ last_message_at: -1 }}
              options={{ limit: 20 }}
            />
          </div>
          <div className="w-2/3 flex flex-col">
            <Channel>
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput />
              </Window>
              <Thread />
            </Channel>
          </div>
        </div>
      </Chat>
    </div>
  );
}
