# Google Cloud Run Deployment Guide

This guide walks you through deploying the Pro Clubs Stats application to Google Cloud Run.

## Why Google Cloud Run?

EA Sports blocks requests from Vercel IP addresses with 403 errors. Competitor sites like chelstats.app successfully use Google Cloud Run (IP: 34.172.21.165) to call EA's API without issues.

## Architecture

```
User → Google Cloud Run → EA Sports API → Cloud Run → User
```

All API routes (`/api/ea/*`) run server-side and proxy requests to EA's API with proper headers.

## Prerequisites

1. Google Cloud account with billing enabled
2. gcloud CLI installed and configured
3. Project created: `central-eon-475405-q6`
4. Region: `europe-west1`

## Environment Variables Required

Set these in Google Cloud Run after deployment:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres.oiunsoxesasgfglokacu:ikXQr8BodX0F7zaR@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://oiunsoxesasgfglokacu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdW5zb3hlc2FzZ2ZnbG9rYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjE3OTAsImV4cCI6MjA3NjA5Nzc5MH0._77xYCDW77W5EaqFimmeYEiW8g0P-x_5GEbRNFX9YdQ

# Discord OAuth Configuration
DISCORD_CLIENT_ID=1428295405354881121
DISCORD_CLIENT_SECRET=EAxM9IUYCBCQN901YUDLP08j6V-KzlcC

# NextAuth/Auth Configuration
AUTH_SECRET=CHF52m5XXRQLEZkzfhnYLHRqHDNiE6UjR0DAxlr1fL0=
AUTH_URL=https://proclubs.io
NEXT_PUBLIC_APP_URL=https://proclubs.io
```

## Deployment Steps

### 1. Verify Configuration

Ensure these files are properly configured:

- `Dockerfile` - Multi-stage build optimized for Next.js 15
- `.dockerignore` - Excludes unnecessary files from build
- `next.config.ts` - Has `output: 'standalone'` enabled
- `package.json` - Build script without `--turbopack` flag

### 2. Deploy to Cloud Run

From the project root, run:

```bash
gcloud run deploy proclubs \
  --source . \
  --region=europe-west1 \
  --allow-unauthenticated \
  --platform=managed \
  --memory=1Gi \
  --cpu=1 \
  --timeout=60 \
  --max-instances=10 \
  --min-instances=0
```

This command:
- Builds the Docker image using Cloud Build
- Deploys to Cloud Run service named "proclubs"
- Allows public access (required for web app)
- Allocates 1GB memory and 1 CPU
- Sets 60-second timeout for requests
- Configures auto-scaling (0-10 instances)

### 3. Set Environment Variables

After initial deployment, set environment variables:

```bash
gcloud run services update proclubs \
  --region=europe-west1 \
  --set-env-vars="DATABASE_URL=postgresql://...,NEXT_PUBLIC_SUPABASE_URL=https://...,AUTH_SECRET=..." \
  --update-secrets="DATABASE_URL=database-url:latest"
```

Or use the Google Cloud Console:
1. Go to Cloud Run → proclubs service
2. Click "Edit & Deploy New Revision"
3. Navigate to "Variables & Secrets" tab
4. Add all environment variables from above

### 4. Configure Custom Domain (Optional)

To use proclubs.io instead of the Cloud Run URL:

```bash
gcloud run domain-mappings create \
  --service=proclubs \
  --domain=proclubs.io \
  --region=europe-west1
```

Then update DNS records as shown in the output.

### 5. Verify Deployment

1. Get the service URL:
   ```bash
   gcloud run services describe proclubs --region=europe-west1 --format='value(status.url)'
   ```

2. Test the endpoints:
   ```bash
   curl https://your-service-url.run.app/api/ea/search-clubs?platform=common-gen5&q=Chelsea
   ```

3. Check logs for EA API responses:
   ```bash
   gcloud run logs read proclubs --region=europe-west1 --limit=50
   ```

Look for `[EA API]` log entries confirming successful responses (not 403s).

## Database Setup

The app uses Supabase PostgreSQL. Before deployment:

1. Ensure Prisma migrations are applied:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push
   ```

2. Verify database connection in Cloud Run logs after deployment

## Monitoring

### View Logs

```bash
# Recent logs
gcloud run logs read proclubs --region=europe-west1 --limit=100

# Follow logs in real-time
gcloud run logs tail proclubs --region=europe-west1
```

### Check Metrics

1. Go to Cloud Console → Cloud Run → proclubs
2. View metrics: request count, latency, container instances, etc.

### Set Up Alerts

Create alerts for:
- High error rates (>5% 5xx responses)
- High latency (>2s p95)
- Container crashes

## Troubleshooting

### Build Fails

If Docker build fails:

```bash
# Test build locally
docker build -t proclubs-test .

# Run locally to test
docker run -p 8080:8080 -e DATABASE_URL="..." proclubs-test
```

### EA API Still Returns 403

1. Check server IP from Cloud Run:
   ```bash
   gcloud run services describe proclubs --region=europe-west1 --format='value(status.address.url)'
   ```

2. Verify headers in `/api/ea/search-clubs/route.ts`:
   - `origin: "https://www.ea.com"`
   - `referer: "https://www.ea.com/"`
   - `user-agent: "Mozilla/5.0"`

3. Try different regions if needed (some IPs may be blocked):
   - `us-central1`
   - `europe-west1`
   - `asia-northeast1`

### Database Connection Issues

Check Prisma connection:
1. Verify `DATABASE_URL` is set correctly
2. Use connection pooling URL (port 6543)
3. Check Supabase logs for connection attempts

## Updating the Application

To deploy updates:

```bash
# Make your code changes, then redeploy
gcloud run deploy proclubs \
  --source . \
  --region=europe-west1
```

Cloud Run will:
1. Build new container image
2. Deploy with zero downtime (gradual rollout)
3. Keep previous revision for rollback

## Rollback

If deployment has issues:

```bash
# List revisions
gcloud run revisions list --service=proclubs --region=europe-west1

# Rollback to previous revision
gcloud run services update-traffic proclubs \
  --region=europe-west1 \
  --to-revisions=proclubs-00001-abc=100
```

## Cost Optimization

Cloud Run pricing:
- Free tier: 2M requests/month, 360,000 GB-seconds/month
- After free tier: ~$0.24 per 1M requests

To optimize costs:
1. Use `--min-instances=0` for auto-scaling to zero
2. Reduce `--memory` if possible (monitor usage first)
3. Set appropriate `--max-instances` to cap costs
4. Enable request caching in API routes

## Production Checklist

Before going live:

- [ ] All environment variables set in Cloud Run
- [ ] Database migrations applied
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and alerts configured
- [ ] Test all API endpoints (search, club info, members, matches)
- [ ] Verify EA API returns data (not 403s)
- [ ] Load test to determine scaling needs
- [ ] Set up automated backups for Supabase
- [ ] Review security settings (IAM, secrets management)

## Support

If you encounter issues:
1. Check Cloud Run logs for errors
2. Test EA API endpoints manually with curl
3. Compare your setup with chelstats.app (successful implementation)
4. Review Next.js 15 standalone mode documentation
