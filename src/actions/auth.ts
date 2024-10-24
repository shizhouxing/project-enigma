'user server'

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function login(formData : FormData) {

    const email = formData.get("username") as string
    const password = formData.get("password") as string

    try {
        const response = await fetch('/api/login/access-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })
    
        const data = await response.json()
    
        if (!response.ok) {
          return {
            success: false,
            message: data.detail || 'Login failed',
          }
        }
        // Set cookies from the response
     (await cookies()).set('auth-token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
  
      redirect('/')
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred during signup',
      }
    }
}

export async function logout() {
    
    let auth_token = (await cookies()).get("auth-token")
    const response = await fetch('/api/user/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization" : `Bearer ${auth_token}`
        },
        
      });
  

    (await cookies()).delete('auth-token')

    redirect('/login')
  }