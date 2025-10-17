# 🔧 Vercel Deployment Troubleshooting

## The Problem
- Sign in gets server error
- Club search doesn't work
- "Server configuration problem"

## Root Cause
Most likely: **Missing or incorrect environment variables on Vercel**

---

## ✅ CHECKLIST: Fix Your Vercel Deployment

### Step 1: Check Environment Variables in Vercel

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

You MUST have all of these set:

```bash
# Required for Database
DATABASE_URL=postgresql://postgres.oiunsoxesasgfglokacu:ikXQr8BodX0F7zaR@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Required for Discord Auth
DISCORD_CLIENT_ID=your_actual_discord_client_id
DISCORD_CLIENT_SECRET=your_actual_discord_client_secret

# Required for NextAuth
AUTH_SECRET=your_generated_secret_from_openssl

# CRITICAL: Must match your Vercel URL
AUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_URL=https://your-project-name.vercel.app

# Public app URL
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
```

### Step 2: Common Mistakes

❌ **WRONG:** `AUTH_URL=http://localhost:3000` (left as localhost)
✅ **RIGHT:** `AUTH_URL=https://your-actual-vercel-url.vercel.app`

❌ **WRONG:** Missing `NEXTAUTH_URL` variable
✅ **RIGHT:** Add both `AUTH_URL` and `NEXTAUTH_URL` with same value

❌ **WRONG:** Database URL from "Direct Connection" (port 5432)
✅ **RIGHT:** Database URL from "Transaction Pooling" (port 6543)

### Step 3: Update Discord OAuth Redirect

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. **OAuth2** → **General** → **Redirects**
4. Add: `https://your-project-name.vercel.app/api/auth/callback/discord`
5. **Save Changes**

### Step 4: Redeploy

After fixing environment variables:

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click **⋮** menu on latest deployment
3. Click **Redeploy**

**Option B: Via Git Push**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## 🔍 How to Find Your Actual Values

### 1. DATABASE_URL
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- **Settings** → **Database** → **Connection String**
- Select **Transaction Pooling** (not Direct Connection)
- Copy the full string

### 2. DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Select your application
- **OAuth2** → **General**
- Copy Client ID and Client Secret

### 3. AUTH_SECRET
If you don't have one, generate it:
```bash
openssl rand -base64 32
```

### 4. AUTH_URL & NEXTAUTH_URL
- Go to Vercel Dashboard → Your Project
- Copy the **Production** URL (e.g., `https://proclubs-stats.vercel.app`)
- Use this EXACT url for both variables

---

## 🧪 Testing After Fix

### Test 1: Club Search
Visit: `https://your-app.vercel.app`
- Search for "Manchester United" or enter club ID `435549`
- Should load club data and stats

### Test 2: Sign In
1. Click "Login with Discord"
2. Should redirect to Discord
3. Authorize the app
4. Should redirect back to your app
5. Should show your Discord profile

### Test 3: Check Logs
In Vercel Dashboard:
1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **View Function Logs**
4. Look for errors (should be none if everything is correct)

---

## 🚨 Still Not Working?

### Check Vercel Function Logs

The error message will tell you exactly what's wrong:

**Common errors and fixes:**

1. **"AUTH_URL is not set"**
   - Add `AUTH_URL` environment variable in Vercel

2. **"Invalid database connection"**
   - Check DATABASE_URL uses port 6543 (pooling), not 5432
   - Verify Supabase project is active

3. **"Invalid client" (Discord error)**
   - Verify Discord redirect URL matches Vercel URL exactly
   - Check DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are correct

4. **"Missing secret"**
   - Add AUTH_SECRET environment variable

---

## 💡 Quick Fix (Most Common Issue)

**99% of the time, this is the problem:**

You're missing the `NEXTAUTH_URL` environment variable. NextAuth v5 needs BOTH:
- `AUTH_URL`
- `NEXTAUTH_URL`

Both should be set to your Vercel production URL.

After adding it, redeploy and everything should work!

---

## 📋 Complete Environment Variables List

Copy this into Vercel's environment variables (replace with your actual values):

```
DATABASE_URL=postgresql://postgres.oiunsoxesasgfglokacu:ikXQr8BodX0F7zaR@aws-1-us-east-1.pooler.supabase.com:6543/postgres
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_secret_here
AUTH_SECRET=your_openssl_generated_secret_here
AUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
```

Make sure ALL are set to **Production** environment!

---

Good luck! 🚀
