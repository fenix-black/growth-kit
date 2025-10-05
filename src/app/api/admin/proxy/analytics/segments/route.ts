import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { errors } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in as admin
    const isAuthenticated = await isAdminAuthenticated();
    
    if (!isAuthenticated) {
      return errors.unauthorized();
    }

    // Forward request to direct API with service key
    const url = new URL('/api/v1/admin/analytics/segments', request.url);
    url.search = request.nextUrl.search; // Copy query params
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.SERVICE_KEY}`,
      },
    });

    if (!response.ok) {
      return errors.serverError();
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in proxy/analytics/segments:', error);
    return errors.serverError();
  }
}
