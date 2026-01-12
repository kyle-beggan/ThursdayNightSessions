import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // 1. Public Paths (No Auth Required)
    const isPublicPath =
        pathname === '/login' ||
        pathname.startsWith('/api/auth') ||
        pathname === '/logo.png' ||
        pathname.startsWith('/_next'); // Next.js assets

    if (isPublicPath) {
        // If user is already logged in and tries to go to login, redirect to dashboard or pending
        if (token && pathname === '/login') {
            if (token.status === 'pending') {
                return NextResponse.redirect(new URL('/pending', req.url));
            }
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        return NextResponse.next();
    }

    // 2. Unauthenticated Users -> Redirect to Login
    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // 3. Authenticated Logic
    const userStatus = token.status as string;

    // Case: Pending User
    if (userStatus === 'pending') {
        // Allow access to /pending and /api/auth (for logout)
        if (pathname === '/pending') {
            return NextResponse.next();
        }
        // Redirect everything else to /pending
        return NextResponse.redirect(new URL('/pending', req.url));
    }

    // Case: Approved/Rejected User
    if (userStatus === 'approved' || userStatus === 'admin') {
        // If approved user tries to go to /pending, redirect to dashboard
        if (pathname === '/pending') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        return NextResponse.next();
    }

    // Default fallback (e.g. rejected users might also go to pending or a specific rejected page)
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (handled in logic, but good to keep in matcher to be safe)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - logo.png (public asset)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
