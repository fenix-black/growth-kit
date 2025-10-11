import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Path to the UMD bundle
    const bundlePath = join(process.cwd(), 'sdk', 'dist', 'bundle.umd.js');
    
    // Check if bundle exists
    if (!existsSync(bundlePath)) {
      console.error('SDK bundle not found at:', bundlePath);
      return NextResponse.json(
        { 
          error: 'SDK bundle not found. Please run the build process.',
          path: bundlePath,
        },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // Read the bundle file
    const bundle = readFileSync(bundlePath, 'utf-8');
    
    // Return the JavaScript bundle with appropriate headers
    return new NextResponse(bundle, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=120', // Cache for 2 minutes (matches TTL)
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error serving SDK bundle:', error);
    return NextResponse.json(
      { error: 'Failed to serve SDK bundle' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

