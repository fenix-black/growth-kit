import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: string,
  message?: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
    },
    { status }
  );
}

/**
 * Standard error responses
 */
export const errors = {
  unauthorized: () => errorResponse('UNAUTHORIZED', 'Invalid or missing API key', 401),
  forbidden: () => errorResponse('FORBIDDEN', 'Access denied', 403),
  notFound: () => errorResponse('NOT_FOUND', 'Resource not found', 404),
  badRequest: (message?: string) => errorResponse('BAD_REQUEST', message, 400),
  serverError: (message?: string) => errorResponse('INTERNAL_ERROR', message || 'An error occurred', 500),
  methodNotAllowed: () => errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405),
};
