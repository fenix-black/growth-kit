import { NextRequest, NextFetchEvent } from 'next/server';

interface GrowthKitMiddlewareConfig {
    apiKey: string;
    apiUrl: string;
    referralPath?: string;
    redirectTo?: string;
    debug?: boolean;
}
declare function createGrowthKitMiddleware(config: GrowthKitMiddlewareConfig): (request: NextRequest, event?: NextFetchEvent) => Promise<any>;
declare function growthKitMiddleware(request: NextRequest, event?: NextFetchEvent): Promise<any>;

export { GrowthKitMiddlewareConfig, createGrowthKitMiddleware, growthKitMiddleware };
