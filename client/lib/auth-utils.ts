import { getAuthToken as getCookieToken } from "./cookie";

export const getAuthToken = async () => {
  const localToken = localStorage.getItem("token");
  if (localToken) return localToken;

  return await getCookieToken();
};
