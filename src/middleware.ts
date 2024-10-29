import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateToken } from '@/service/auth'
 
const private_routes = ["/c"] 

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {

    const { pathname } = request.nextUrl
    const response = NextResponse.next()
    const token = request.cookies.get('auth-token')

    // check if user is logged in then & if so send them to /
    if (pathname.startsWith("/login")){
        const isValidToken = await validateToken(token?.value);
        if (isValidToken) return NextResponse.redirect(new URL('/', request.url))
    }
    
    if (private_routes.includes(pathname)){
        const isValidToken = await validateToken(token?.value);
        // if the user traverses to a private route then check
        // token if it valid and if not redirect to login
        if (!isValidToken) {
            if (token) request.cookies.delete("auth-token");
            return NextResponse.redirect(new URL('/login', request.url))    
        } else if (!isValidToken) {
            // token should be delete if token is not valid
            if (token) request.cookies.delete("auth-token");
        }
    }
    
    // next route
    return response
}
 
// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)'],
}