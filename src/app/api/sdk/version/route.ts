import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Read version from SDK package.json
    const sdkPackagePath = join(process.cwd(), 'sdk', 'package.json');
    const sdkPackage = JSON.parse(readFileSync(sdkPackagePath, 'utf-8'));
    const version = sdkPackage.version;
    
    // Generate build hash from timestamp and version
    // In production, this could be git commit hash
    const buildTime = new Date().toISOString();
    const buildHash = Buffer.from(buildTime).toString('base64').substring(0, 8);
    const fullVersion = `${version}+${buildHash}`;
    
    // Get origin for constructing bundle URL
    const origin = request.headers.get('origin') || 'https://growth.fenixblack.ai';
    const protocol = origin.startsWith('http://') ? 'http://' : 'https://';
    const host = request.headers.get('host') || 'growth.fenixblack.ai';
    const bundleUrl = `${protocol}${host}/api/sdk/latest/bundle.js`;
    
    const response = {
      version,
      buildHash,
      buildTime,
      fullVersion,
      bundleUrl,
      forceUpdate: false, // Can be toggled for emergency updates
      minVersion: version, // Optional: minimum required version
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Error reading SDK version:', error);
    return NextResponse.json(
      { error: 'Failed to read SDK version' },
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

