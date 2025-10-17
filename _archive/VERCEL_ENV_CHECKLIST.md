# ✅ Vercel Environment Variables Checklist

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

You should have ALL of these set:

---

## Required Variables

### 1. DATABASE_URL
```
DATABASE_URL=postgresql://postgres.oiunsoxesasgfglokacu:ikXQr8BodX0F7zaR@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 2. DISCORD_CLIENT_ID
```
DISCORD_CLIENT_ID=1428295405354881121
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 3. DISCORD_CLIENT_SECRET
```
DISCORD_CLIENT_SECRET=EAxM9IUYCBCQN901YUDLP08j6V-KzlcC
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 4. AUTH_SECRET
```
AUTH_SECRET=CHF52m5XXRQLEZkzfhnYLHRqHDNiE6UjR0DAxlr1fL0=
```
**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 5. AUTH_URL (CRITICAL - Must be your actual Vercel URL!)
```
AUTH_URL=https://your-actual-vercel-url.vercel.app
```
**Replace `your-actual-vercel-url` with your REAL Vercel domain!**

**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 6. NEXTAUTH_URL (CRITICAL - Same as AUTH_URL!)
```
NEXTAUTH_URL=https://your-actual-vercel-url.vercel.app
```
**Replace `your-actual-vercel-url` with your REAL Vercel domain!**

**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 7. NEXT_PUBLIC_APP_URL (Optional but recommended)
```
NEXT_PUBLIC_APP_URL=https://your-actual-vercel-url.vercel.app
```
**Replace `your-actual-vercel-url` with your REAL Vercel domain!**

**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

## How to Find Your Vercel URL

1. Go to **Vercel Dashboard** → Your Project
2. Look at the top - you'll see something like:
   - `proclubs-stats-neatway.vercel.app`
   - Or `proclubs-stats-6z4b1tsf6-neatways-projects.vercel.app`
3. Use the **shorter production URL** (without the random letters)
4. Format: `https://proclubs-stats-neatway.vercel.app` (example)

---

## Common Mistakes to Check

❌ **WRONG:** `AUTH_URL=http://localhost:3000` (left as localhost)
✅ **RIGHT:** `AUTH_URL=https://your-vercel-url.vercel.app`

❌ **WRONG:** Missing `NEXTAUTH_URL` completely
✅ **RIGHT:** Both `AUTH_URL` and `NEXTAUTH_URL` set to same Vercel URL

❌ **WRONG:** Using preview deployment URL (with random letters)
✅ **RIGHT:** Using production URL (clean domain name)

❌ **WRONG:** Selected only "Production" environment
✅ **RIGHT:** Selected all three: Production, Preview, Development

---

## Quick Test

After setting all variables, check them:

1. In Vercel, go to **Environment Variables**
2. You should see **7 variables** listed
3. Each should show: `Production, Preview, Development`
4. Click on each one to verify the value

---

## If You Need to Change AUTH_URL/NEXTAUTH_URL

1. Find your production URL (e.g., `proclubs-stats-abc123.vercel.app`)
2. Delete the old `AUTH_URL` and `NEXTAUTH_URL` variables
3. Add them again with the correct URL:
   ```
   AUTH_URL=https://proclubs-stats-abc123.vercel.app
   NEXTAUTH_URL=https://proclubs-stats-abc123.vercel.app
   ```
4. Select all three environments
5. **Redeploy** after saving

---

## After Setting Variables

**You MUST redeploy for changes to take effect:**

1. Go to **Deployments** tab
2. Click **⋮** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes

---

## Screenshot What You See

If you want me to verify, you can:
1. Take a screenshot of your Environment Variables page
2. Share it (Vercel hides sensitive values by default)
3. I can confirm if everything looks correct

---

Good luck! 🚀
