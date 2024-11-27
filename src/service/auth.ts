'use server';
import { cookies } from "next/headers";
import { TokenResponse, Message, ActionResponse } from "@/types/response";
import { API_CONFIG } from "@/lib/config/api";
import { handleResponse } from "./utils";

const cookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "345600"),
};

async function handleAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("sessionKey", token, cookieOptions);
}

export async function login(username: string, password: string): Promise<ActionResponse> {
  try {
    const url = new URL(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      process.env.FRONTEND_HOST
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "username" : username,
        "password" : password
      }),
    });

    const data = await handleResponse<TokenResponse>(response);
    await handleAuthCookie(data.access_token);

    return { ok: true };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      ok: false,
      status: error.status,
      message: error.message || "An unexpected error occurred.",
    };
  }
}


export async function signup(formData: FormData): Promise<ActionResponse> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const url = new URL(
    API_CONFIG.ENDPOINTS.USER.REGISTER,
    process.env.FRONTEND_HOST
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    await handleResponse(response);
    return { ok: true };
  } catch (error: any) {
    console.error("Signup Error: ", error);
    return {
      ok: false,
      status: error.status,
      message: error.message || "An error occurred during signup",
    };
  }
}

export async function validateToken(): Promise<
  { ok: boolean; id? : string; username?: string; image?: string; error?: string }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sessionKey")?.value;

  if (!token) {
    return { ok: false, error: "token does not exist" }; // Indicate missing token
  }

  const url = new URL(
    API_CONFIG.ENDPOINTS.AUTH.VERIFY,
    process.env.FRONTEND_HOST
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Custom error message based on response status
      return {
        ok: false,
        error:
          response.status === 401
            ? "Unauthorized: Invalid token"
            : `Error: ${response.statusText} (${response.status})`,
      };
    }

    const result = await handleResponse<Message>(response);
    return {ok: true, ...result.data};
  } catch (err) {
    // Different handling based on error type
    if (err instanceof TypeError) {
      console.error("Network error or invalid request:", err.message);
      return { ok: false, error: "Network error or invalid request" }; // Optional return format
    } else if (err instanceof Error) {
      console.error("Validation error:", err.message);
      return { ok: false, error: err.message }; // Custom error message from above
    }

    // Catch-all for other types of errors
    console.error("Unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function checkUsername(username: string): Promise<{ available: boolean; 
                                                                 status? : number;
                                                                 error?: string }> {
  try {
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    
    // Validate username format and length
    if (!usernameRegex.test(username) || username.length < 3 || username.length > 50) {
      return { available: false, status : 404, error: "Username does not meet the required format or length" };
    }

    const url = new URL(
      API_CONFIG.ENDPOINTS.USER.AVAILABLE,
      process.env.FRONTEND_HOST
    );
    url.searchParams.append("username", username);

    const response = await fetch(url.toString());
    

    // Handle response status
    if (!response.ok) {
      return {
        available: false,
        status : response.status,
        error: response.status === 404
          ? "Username endpoint not found" 
          : `Username sign in is though the provider`
      };
    }

    const data = await handleResponse<Message>(response);

    return { available: data.data ?? false };
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("Network error or invalid request:", error.message);
      return { available: false, status : 404, error: "Network error or invalid request" };
    } else if (error instanceof Error) {
      console.error("Error checking username:", error.message);
      return { available: false, status : 404, error: error.message };
    }

    // Catch-all for other types of errors
    console.error("Unexpected error:", error);
    return { available: false, status : 404, error: "An unexpected error occurred" };
  }
}


// Helper function to get the current auth token
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const authToken = await cookieStore.get("sessionKey");
  return authToken?.value || null;
}

// Helper function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

export async function DeleteSessionKey() : Promise<void>{
  const cookieStore = await cookies();
  await cookieStore.delete("sessionKey");
  return;
}
