import { NextRequest, NextFetchEvent } from 'next/server';

declare function growthKitMiddleware(request: NextRequest, event?: NextFetchEvent): Promise<any>;

declare const middleware: typeof growthKitMiddleware;
declare const config: {
    matcher: string[];
};

export { config, middleware };
