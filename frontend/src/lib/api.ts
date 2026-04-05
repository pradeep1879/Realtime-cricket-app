import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://realtime-cricket-app.onrender.com";
export const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL ?? API_BASE_URL.replace(/^http/, "ws");

const TOKEN_KEY = "cricket-admin-token";

export function getAdminToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = getAdminToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message =
        (typeof error.response?.data === "object" &&
        error.response?.data &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : null) ??
        (error.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : null) ??
        error.message ??
        "Request failed";

      throw new Error(message);
    }

    throw error instanceof Error ? error : new Error("Request failed");
  }
);

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiClient.request<T>({
    url: path,
    method: init?.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined,
    data:
      typeof init?.body === "string" && init.body.length > 0
        ? JSON.parse(init.body)
        : init?.body,
    headers: init?.headers as Record<string, string> | undefined
  });

  return response.data;
}
