"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiClient } from "@/utils/api";
import { AuthResponse, TokenResponse } from "@/types/auth";
import { API_CONFIG } from "@/lib/config/api";

const api = new ApiClient({
    baseURL : process.env.FRONTEND_HOST || "http://localhost:3000"
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "345600"),
};

async function handleAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, cookieOptions);
}

export async function login(formData: FormData): Promise<AuthResponse> {

  try {
    const response = await api.post<TokenResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      formData);
    
    // handle the authentication token
    await handleAuthCookie(response.access_token);

    return {
        success : true,
    }
  } catch (error) {
    return {
        success : false,
        message : (error as AuthResponse).data.detail
    } as AuthResponse
  }
}

export async function signup(formData: FormData): Promise<AuthResponse> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  try {

    const response = await api.post<AuthResponse>(
        `${API_CONFIG.ENDPOINTS.USER.REGISTER}`, 
        {username,password}
    );

    if (response.error) {
      return {
        success: false,
        message: response.error?.detail || "Signup failed",
      };
    }

    return response;
  } catch (error) {
    console.error("Signup Error: ", error)
    return {
      success: false,
      message: "An error occurred during signup",
    };
  }
}

export async function checkUsername(username: string): Promise<boolean> {
  try {
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username) || username.length < 3 || username.length > 50) {
      return false;
    }

    const response = await api.get<{ data: boolean }>(
      `${API_CONFIG.ENDPOINTS.USER.AVAILABLE}?username=${encodeURIComponent(username)}`
    );
    
    
    return response.data ?? false;
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");

  try {
    if (authToken) {
      const _ = await api.post<void>(
        API_CONFIG.ENDPOINTS.USER.LOGOUT, {
        headers: {
          Authorization: `Bearer ${authToken.value}`,
        },
      });
    }

    cookieStore.delete("auth-token");
    redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("An error occurred during logout");
  }
}

// Helper function to get the current auth token
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");
  return authToken?.value || null;
}

// Helper function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}
