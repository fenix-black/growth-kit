import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { verifyServiceKey } from '@/lib/security/auth';
import { prisma } from '@/lib/db';
import { successResponse, errors } from '@/lib/utils/response';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    const { id } = await params;

    // Check if app exists
    const app = await prisma.app.findUnique({
      where: { id },
    });

    if (!app) {
      return errors.notFound();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    // Handle URL mode
    if (url && !file) {
      // Validate URL format
      try {
        new URL(url);
      } catch {
        return errors.badRequest('Invalid URL format');
      }

      // Update app with external URL
      await prisma.app.update({
        where: { id },
        data: { logoUrl: url },
      });

      return successResponse({
        logoUrl: url,
        mode: 'url',
      });
    }

    // Handle file upload mode
    if (!file) {
      return errors.badRequest('No file or URL provided');
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return errors.badRequest('Only PNG, JPG, and WebP images are allowed. SVG is not supported.');
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return errors.badRequest('File must be under 5MB');
    }

    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return errors.serverError('Vercel Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN environment variable or use the URL option instead.');
    }

    // Upload to Vercel Blob
    const filename = `app-logos/${id}-${Date.now()}.${file.type.split('/')[1]}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Update app with new logo URL
    await prisma.app.update({
      where: { id },
      data: { logoUrl: blob.url },
    });

    return successResponse({
      logoUrl: blob.url,
      mode: 'upload',
      size: file.size,
    });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return errors.serverError('Failed to upload logo');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify service key
    if (!verifyServiceKey(request.headers)) {
      return errors.forbidden();
    }

    const { id } = await params;

    // Remove logo URL from app
    await prisma.app.update({
      where: { id },
      data: { logoUrl: null },
    });

    return successResponse({
      success: true,
      message: 'Logo removed',
    });
  } catch (error: any) {
    console.error('Error removing logo:', error);
    return errors.serverError('Failed to remove logo');
  }
}

