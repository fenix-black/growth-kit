import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple language detection for first visit
  const hasLanguageCookie = request.cookies.has('NEXT_LOCALE');
  
  if (!hasLanguageCookie) {
    const acceptLanguage = request.headers.get('accept-language');
    const language = acceptLanguage?.toLowerCase().includes('es') ? 'es' : 'en';
    
    const response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', language, {
      path: '/',
      maxAge: 31536000, // 1 year
    });
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
