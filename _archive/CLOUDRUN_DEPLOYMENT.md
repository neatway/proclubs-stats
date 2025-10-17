# Google Cloud Run Deployment Guide

## Why Cloud Run?

chelstats.app (IP: 34.172.21.165) successfully uses Google Cloud Run and EA Sports API accepts their requests. Vercel and Cloudflare Workers get blocked by EA.

## Prerequisites

1. **Google Cloud account** (free tier available)
2. **gcloud CLI** installed: https://cloud.google.com/sdk/docs/install
3. **Docker** installed

## Setup Steps

### 1. Install gcloud CLI (if not installed)

Windows:
```powershell
# Download from https://cloud.google.com/sdk/docs/install
```

Mac/Linux:
```bash
curl https://sdk.cloud.google.com | bash
```

### 2. Login to Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 4. Configure Docker for GCP

```bash
gcloud auth configure-docker
```

### 5. Set Environment Variables

Create `.env.production` file:
```
DATABASE_URL=your_database_url_here
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://your-cloudrun-url.run.app
```

### 6. Build and Deploy

**Option A: Using the deployment script**

```bash
# Edit deploy-cloudrun.sh and set your PROJECT_ID
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh
```

**Option B: Manual commands**

```bash
# Set your project ID
PROJECT_ID="your-gcp-project-id"
SERVICE_NAME="proclubs-stats"
REGION="us-central1"

# Build image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars DATABASE_URL="$DATABASE_URL"
```

### 7. Get Your URL

After deployment, Cloud Run will give you a URL like:
```
https://proclubs-stats-xxxxx-uc.a.run.app
```

## Pricing

**Free Tier (per month):**
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

**After free tier:**
- $0.40 per million requests
- $0.0000025 per GB-second
- Very affordable for small/medium traffic

## Environment Variables

Set them in Cloud Run console or via command:

```bash
gcloud run services update proclubs-stats \
  --set-env-vars DATABASE_URL="your_database_url" \
  --region us-central1
```

## Custom Domain (Optional)

```bash
# Map your domain
gcloud beta run domain-mappings create \
  --service proclubs-stats \
  --domain proclubs.io \
  --region us-central1
```

## Monitoring

View logs:
```bash
gcloud run services logs read proclubs-stats --region us-central1
```

## Troubleshooting

**Build fails:**
- Check Docker is running
- Check you have latest Node.js image

**Deploy fails:**
- Verify APIs are enabled
- Check authentication: `gcloud auth list`
- Verify project ID: `gcloud config get-value project`

**EA API still blocked:**
- Unlikely, but if it happens, we need residential proxy service

## Success Checklist

- [ ] gcloud CLI installed
- [ ] Logged in: `gcloud auth login`
- [ ] APIs enabled
- [ ] Docker configured
- [ ] Environment variables set
- [ ] Image built and pushed
- [ ] Service deployed
- [ ] URL accessible
- [ ] EA API search working!
