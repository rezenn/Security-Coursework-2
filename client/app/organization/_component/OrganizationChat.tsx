"use client";

import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  ChannelList,
  Window,
} from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";

import "stream-chat-react/dist/css/v2/index.css";

interface OrganizationChatProps {
  userId: string;
  userName: string;
  userImage?: string;
}

interface Member {
  user_id?: string;
  user?: {
    id: string;
    name?: string;
    image?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Message {
  text?: string;
  [key: string]: any;
}

export default function OrganizationChat({
  userId,
  userName,
  userImage,
}: OrganizationChatProps) {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const initChat = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
          throw new Error("API key not found");
        }

        const res = await fetch("/api/stream-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) throw new Error("Failed to get token");

        const { token } = await res.json();

        const client = StreamChat.getInstance(apiKey);
        await client.connectUser(
          { id: userId, name: userName, image: userImage },
          token,
        );

        setChatClient(client);
      } catch (err) {
        setError("Failed to connect to chat");
      }
    };

    initChat();

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
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

  const filters = { type: "messaging", members: { $in: [userId] } };
  const sort = { last_message_at: -1 };

  const CustomPreview = (props: any) => {
    const { channel } = props;

    const members = Object.values(channel.state?.members || {}) as Member[];
    const otherMember = members.find(
      (member: Member) => member.user_id !== userId,
    );
    const otherUser = otherMember?.user;

    const messages = channel.state?.messages || [];
    const lastMessage =
      messages.length > 0 ? (messages[messages.length - 1] as Message) : null;

    const getUserImageUrl = () => {
      if (otherUser?.image) {
        if (otherUser.image.startsWith("http")) {
          return otherUser.image;
        }
        return `http://localhost:5050/uploads/profile/${otherUser.image}`;
      }
      return null;
    };

    const userImageUrl = otherUser ? getUserImageUrl() : null;

    return (
      <div
        className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
          activeChannel?.cid === channel.cid ? "bg-blue-50" : ""
        }`}
        onClick={() => setActiveChannel(channel)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-fuchsia-400 ">
            {userImageUrl ? (
              <img
                src={userImageUrl}
                alt={otherUser?.name || "User"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-white font-bold text-lg">${otherUser?.name?.[0]?.toUpperCase() || "U"}</span>`;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                {otherUser?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <strong className="block truncate">
              {otherUser?.name || "Unknown User"}
            </strong>
            <p className="text-sm text-gray-500 truncate">
              {lastMessage?.text || "No messages yet"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 px-5">
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 rounded-t-3xl">
        <h2 className="text-xl font-bold text-gray-900">Messages with Users</h2>
      </div>

      <div className="h-[550px] bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100">
        <Chat client={chatClient} theme="messaging light">
          <div className="flex h-full">
            <div className="w-1/3 border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700">Conversations</h3>
              </div>
              <ChannelList
                filters={filters}
                sort={{ last_message_at: -1 }}
                options={{ limit: 20 }}
                Preview={CustomPreview}
              />
            </div>

            <div className="w-2/3 flex flex-col">
              {activeChannel ? (
                <Channel channel={activeChannel}>
                  <Window>
                    <ChannelHeader />
                    <MessageList />
                    <MessageInput />
                  </Window>
                  <Thread />
                </Channel>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">
                    Choose a chat from the list to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        </Chat>
      </div>
    </div>
  );
}
