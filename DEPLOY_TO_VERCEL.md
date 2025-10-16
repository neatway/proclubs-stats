# 🚀 Deploy to Vercel - Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Ready
- [ ] `DATABASE_URL` - Get from Supabase
- [ ] `DISCORD_CLIENT_ID` - Get from Discord Developer Portal
- [ ] `DISCORD_CLIENT_SECRET` - Get from Discord Developer Portal
- [ ] `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] (Optional) `NEXT_PUBLIC_SUPABASE_URL` - For when you add Supabase features
- [ ] (Optional) `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For when you add Supabase features

### 2. Discord OAuth Configuration
- [ ] Add production redirect URL in Discord Developer Portal:
  - `https://your-domain.vercel.app/api/auth/callback/discord`
- [ ] Update `AUTH_URL` env var to match your Vercel URL

### 3. Code is Ready
- [ ] Latest code pushed to GitHub
- [ ] Build passes locally: `npm run build`
- [ ] No console errors in development

---

## 📦 Deployment Steps

### Step 1: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Select your GitHub repository
4. Click **"Import"**

### Step 2: Configure Project

Vercel will auto-detect Next.js. The default settings are perfect:

- **Framework Preset:** Next.js
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

✅ **Do NOT change these settings!**

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

```
DATABASE_URL=postgresql://postgres:[password]@...
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
AUTH_SECRET=your_generated_secret_here
AUTH_URL=https://your-project-name.vercel.app
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
```

**Pro Tip:** You can paste multiple variables at once in the format:
```
KEY1=value1
KEY2=value2
```

### Step 4: Deploy!

1. Click **"Deploy"**
2. Wait 1-2 minutes for the build
3. Get your deployment URL (e.g., `https://your-project.vercel.app`)

---

## 🔧 Post-Deployment Configuration

### Update Discord OAuth Redirect

1. Go to Discord Developer Portal
2. Navigate to your application → **OAuth2** → **General**
3. Add redirect URL:
   ```
   https://your-project-name.vercel.app/api/auth/callback/discord
   ```
4. Click **"Save Changes"**

### Test the Deployment

1. Visit your Vercel URL
2. Try searching for a club
3. Test Discord login
4. Check all pages load correctly

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Check:**
- Your local build works: `npm run build`
- All dependencies are in `package.json`
- `.env.example` exists (helps Vercel know what vars are needed)

**Our Setup:**
- ✅ TypeScript errors won't block builds (`ignoreBuildErrors: true`)
- ✅ ESLint errors won't block builds (`ignoreDuringBuilds: true`)

### "Invalid Client" Error (Discord OAuth)

**Fix:**
- Verify `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are correct
- Verify redirect URL in Discord matches your Vercel URL exactly
- Make sure `AUTH_URL` environment variable is set correctly

### Database Connection Errors

**Fix:**
- Verify `DATABASE_URL` is correct (use **Transaction Pooling** URL from Supabase)
- Check Supabase project is active
- Run migrations: `npm run db:push` (do this locally if not done)

### Images Not Loading

**Fix:**
- Images from EA CDN are already configured in `next.config.ts`
- If you add new image sources, add them to `remotePatterns` in `next.config.ts`

---

## 🔄 Continuous Deployment

### Automatic Deployments

Every time you push to GitHub `main` branch:
1. Vercel automatically detects the push
2. Runs `npm run build`
3. Deploys the new version
4. Takes ~1-2 minutes

### Preview Deployments

- Pull requests get preview URLs automatically
- Test changes before merging to `main`
- Each PR comment shows the preview link

---

## 📊 Monitoring Your App

### Vercel Dashboard

View:
- **Deployments:** All your builds and their status
- **Analytics:** Page views, performance metrics
- **Logs:** Real-time logs from your app
- **Speed Insights:** Performance scores

### Check Performance

1. Go to your project in Vercel
2. Click **"Speed Insights"** tab
3. See Core Web Vitals scores

**Target for 500k sessions/month:**
- ✅ API caching is configured (60-300 seconds)
- ✅ Images optimized via Next.js
- ✅ Static pages cached at edge

---

## 🎯 Scaling to 500k Sessions/Month

### Current Setup (✅ Already Optimized)

1. **Edge Caching:** API responses cached for 60-300 seconds
2. **Image Optimization:** EA CDN images processed by Next.js
3. **Server Components:** Most pages render on the server (faster)
4. **Vercel Edge Network:** Your app runs in 20+ global locations

### When You Grow (Future)

**At 100k sessions/month:**
- ✅ You're fine! Current setup handles this easily

**At 500k sessions/month:**
- Consider: Vercel Pro plan ($20/month for better limits)
- Consider: Redis for session storage (optional)
- Monitor: Supabase connection pool limits

**At 1M+ sessions/month:**
- Add: Dedicated database (Supabase scales automatically)
- Add: CDN for static assets
- Upgrade: Vercel Pro or Enterprise

---

## 💰 Cost Estimate (Beginner-Friendly Breakdown)

### Free Tier (0-100k sessions/month)
- **Vercel:** FREE (Hobby plan)
- **Supabase:** FREE (up to 500MB database, 2GB bandwidth)
- **Total:** $0/month ✅

### Growing (100k-500k sessions/month)
- **Vercel:** $20/month (Pro plan - better limits)
- **Supabase:** FREE or $25/month (Pro for more storage)
- **Total:** $20-45/month

### Scale (500k-1M sessions/month)
- **Vercel:** $20/month (Pro plan)
- **Supabase:** $25/month (Pro plan)
- **Optional Redis:** $10/month (Upstash)
- **Total:** $30-55/month

**Bottom Line:** Start free, upgrade only when you need to. Your current setup handles 100k+ sessions easily!

---

## 📚 Learn More

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Scaling:** https://supabase.com/docs/guides/platform/performance

---

## ✅ Deployment Complete!

Once deployed:
1. ✅ App is live at your Vercel URL
2. ✅ Auto-deploys on every git push
3. ✅ Preview deployments for PRs
4. ✅ Analytics and monitoring included
5. ✅ Scales automatically to 100k+ sessions

**Share your Vercel URL and start tracking those Pro Clubs stats! 🎮⚽**
