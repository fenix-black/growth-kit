# Redis Setup for GrowthKit

GrowthKit uses Upstash Redis for distributed rate limiting in production. If you don't configure Redis, the system will automatically fall back to in-memory rate limiting.

## When do you need Redis?

- **Production deployments** with multiple serverless functions
- **High-traffic applications** where rate limiting needs to be shared across instances
- **Distributed deployments** across multiple regions

## For local development

Redis is **optional** for local development. The system will automatically use in-memory rate limiting when Redis credentials are not provided.

## Setting up Upstash Redis (Optional)

1. **Create an Upstash account** at [upstash.com](https://upstash.com)

2. **Create a new Redis database**
   - Choose a region close to your deployment
   - Select the free tier for development

3. **Get your credentials**
   - Copy the `UPSTASH_REDIS_REST_URL`
   - Copy the `UPSTASH_REDIS_REST_TOKEN`

4. **Add to your environment variables**

   For local development (`.env.local`):
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```

   For Vercel deployment:
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL
   vercel env add UPSTASH_REDIS_REST_TOKEN
   ```

## Testing Redis Connection

You can test your Redis connection by checking the console logs when your application starts. You should see:

- ✅ **No warning messages** if Redis is connected successfully
- ⚠️ **"Using in-memory rate limiting"** if Redis is not configured (this is normal for development)
- ❌ **"Redis ping failed"** if Redis credentials are incorrect

## Rate Limiting Behavior

| Environment | Redis Status | Rate Limiting |
|-------------|--------------|---------------|
| Development | Not configured | In-memory (per process) |
| Development | Configured | Shared across requests |
| Production | Not configured | In-memory (per serverless function) |
| Production | Configured | Shared across all functions |

## Troubleshooting

### "Redis ping failed" during build
This is expected behavior during Next.js static generation. The system will automatically fall back to in-memory rate limiting.

### Rate limits not working across instances
Make sure your Redis credentials are correctly configured in your production environment.

### High Redis usage
The default rate limits are:
- API calls: 100 requests per minute per IP
- Sensitive operations: 10 requests per minute per IP  
- Per fingerprint: 500 requests per hour

You can adjust these in `src/lib/middleware/rateLimitSafe.ts`.
