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
      console.log(res)

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