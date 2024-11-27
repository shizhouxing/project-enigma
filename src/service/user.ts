'use server';
import { cookies } from "next/headers";
import { usernameSchema } from "@/lib/definition";
import { handleResponse } from "./utils";


export async function createUsername(username: string): Promise<{
    ok: boolean;
    status?: number;
    message?: string;
  }> {
    
    // Validate the username
    const result = usernameSchema.safeParse(username);
    if (!result.success) {
      return {
        ok: false,
        status: 400,
        message: result.error.errors[0].message
      };
    }
  
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('sessionKey')?.value;
  
      if (!token) {
        return {
          ok: false,
          status: 401,
          message: 'Authentication required'
        };
      }
  
      const response = await fetch(`${process.env.FRONTEND_HOST}/api/update-username?username=${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
  
      const res : {status : number, message : string, data : any }= await handleResponse(response);

      return {
        ok: true,
        status : res.status
      };
  
    } catch (error: any) {
      console.error("Username Update Error:", error);
      return {
        ok: false,
        status: error.status || 500,
        message: error.message || "Failed to update username"
      };
    }
  }



export async function getUser(): Promise<{
    ok: boolean;
    status?: number;
    message?: string;
    id?: string;
    username?: string;
    image?: string;
    history?: { title: string; _id: string }[];
    pinned?: { _id: string }[];
  }> {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionKey')?.value;
    
    if (!token) {
      return {
        ok: false,
        status: 401,
        message: 'Authentication required'
      };
    }
    
    try {
      const response = await fetch(`${process.env.FRONTEND_HOST}/api/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      const res: { status: number; message: string; data: any } = await handleResponse(response);
      return {
        ok: true,
        ...res
      };
    } catch (error) {
      // Handle specific error types
      if (error instanceof TypeError) {
        // Network errors, CORS issues, etc.
        return {
          ok: false,
          status: 503,
          message: 'Service unavailable. Please check your connection.'
        };
      }
      
      if (error instanceof Error) {
        // Generic error handling
        return {
          ok: false,
          status: 500,
          message: error.message || 'An unexpected error occurred'
        };
      }
      
      // Fallback for unknown error types
      return {
        ok: false,
        status: 500,
        message: 'An unknown error occurred'
      };
    }
  }


  export async function pinGame(gameId: string): Promise<{
    ok: boolean;
    status?: number;
    message?: string;
  }> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('sessionKey')?.value;
      if (!token) {
        return {
          ok: false,
          status: 401,
          message: 'Authentication required'
        };
      }
  
      const response = await fetch(`${process.env.FRONTEND_HOST}/api/pinned/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
  
      const res: { status: number, message: string, data: any } = await handleResponse(response);
      return {
        ok: true,
        status: res.status,
        message: res.message
      };
    } catch (error: any) {
      console.error("Pin Game Error:", error);
      return {
        ok: false,
        status: error.status || 500,
        message: error.message || "Failed to pin game"
      };
    }
  }
  
  export async function unpinGame(gameId: string): Promise<{
    ok: boolean;
    status?: number;
    message?: string;
  }> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('sessionKey')?.value;
      if (!token) {
        return {
          ok: false,
          status: 401,
          message: 'Authentication required'
        };
      }
  
      const response = await fetch(`${process.env.FRONTEND_HOST}/api/pinned/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
  
      const res: { status: number, message: string, data: any } = await handleResponse(response);
      return {
        ok: true,
        status: res.status,
        message: res.message
      };
    } catch (error: any) {
      console.error("Unpin Game Error:", error);
      return {
        ok: false,
        status: error.status || 500,
        message: error.message || "Failed to unpin game"
      };
    }
  }