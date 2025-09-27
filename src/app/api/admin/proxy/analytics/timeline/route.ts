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
    
    // Get the service key from environment
    const serviceKey = process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025';
    
    // Forward the request to the actual API endpoint
    const url = new URL(request.url);
    url.pathname = '/api/v1/analytics/timeline';
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
      },
    });
    
    if (!response.ok) {
      return errors.serverError();
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in proxy/analytics/timeline:', error);
    return errors.serverError();
  }
}
