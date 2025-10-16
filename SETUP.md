# Pro Clubs Stats Hub - Setup Guide

## Session 1: Discord Auth + Player Claiming Foundation

This guide will help you set up the authentication system and player claiming functionality for the Pro Clubs Stats Hub.

---

## Prerequisites

- Node.js 18+ installed
- A Supabase account (for PostgreSQL database)
- A Discord account and Discord Developer Application

---

## Step 1: Database Setup (Supabase)

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: pro-clubs-stats
   - **Database Password**: (choose a strong password)
   - **Region**: (select closest to you)
4. Wait for the project to be created (~2 minutes)

### 1.2 Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Under "Connection string", select **Transaction pooler** (for better Prisma performance)
3. Copy the connection string (format: `postgresql://postgres:[password]@...`)
4. Replace `[password]` with your actual database password

---

## Step 2: Discord OAuth Setup

### 2.1 Create Discord Application

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**
3. Enter a name (e.g., "Pro Clubs Stats Hub") and click **Create**

### 2.2 Configure OAuth Settings

1. In your application, go to **OAuth2** → **General**
2. Under **Redirects**, click **Add Redirect**
3. Add: `http://localhost:3000/api/auth/callback/discord`
4. For production, also add: `https://your-domain.com/api/auth/callback/discord`
5. Click **Save Changes**

### 2.3 Get Client Credentials

1. In the **OAuth2** → **General** page:
   - Copy the **CLIENT ID**
   - Click **Reset Secret** and copy the **CLIENT SECRET** (keep this secret!)

---

## Step 3: Environment Variables

### 3.1 Create .env.local file

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres

# Discord OAuth Configuration
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# NextAuth Configuration
# Generate a random secret: openssl rand -base64 32
AUTH_SECRET=your_generated_secret_here
AUTH_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Generate AUTH_SECRET

Run this command to generate a secure random secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `AUTH_SECRET` value.

---

## Step 4: Install Dependencies and Run Migrations

### 4.1 Install packages

```bash
npm install
```

### 4.2 Generate Prisma Client

```bash
npm run db:generate
```

### 4.3 Run database migrations

```bash
npm run db:push
```

This will create all the necessary tables in your Supabase database:
- `Account` - NextAuth account data
- `Session` - NextAuth sessions
- `User` - User profiles with Discord info
- `ClaimedPlayer` - Player profile claims
- `Follow` - User follow relationships

---

## Step 5: Connect Console Accounts to Discord

For the player claiming feature to work, users need to connect their console accounts to Discord:

### 5.1 Connect PlayStation Network (PSN)

1. Open Discord → **User Settings** → **Connections**
2. Click the **PlayStation Network** icon
3. Sign in with your PSN account
4. Authorize the connection

### 5.2 Connect Xbox Live

1. Open Discord → **User Settings** → **Connections**
2. Click the **Xbox** icon
3. Sign in with your Microsoft account
4. Authorize the connection

### 5.3 Connect Battle.net (for PC)

1. Open Discord → **User Settings** → **Connections**
2. Click the **Battle.net** icon
3. Sign in with your Battle.net account
4. Authorize the connection

---

## Step 6: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing the Setup

### 6.1 Test Discord Login

1. Click **Sign In** in the navigation
2. You'll be redirected to Discord
3. Authorize the application
4. You'll be redirected back to the homepage
5. Your Discord avatar and username should appear in the navigation

### 6.2 Test Profile Page

1. Click on your avatar/username in the navigation
2. You should see your profile with:
   - Discord avatar
   - Username
   - Connected console accounts (if you've linked them in Discord)
   - Follower/Following counts

### 6.3 Test Player Claiming

1. Go to your profile page
2. Scroll to "Claim a Player Profile"
3. Fill in the form:
   - **Platform**: Choose current or previous gen
   - **Console Username**: Must match one of your Discord-connected accounts
   - **EA Player Name**: Must match your console username (for verification)
   - **Persona ID**: Find this from EA Pro Clubs website/API
   - **Club ID** (optional): Your current club ID
   - **Club Name** (optional): Your current club name
4. Click **Claim Player**
5. Your claimed player should appear in the "Claimed Players" section

---

## Database Management

### View your database with Prisma Studio

```bash
npm run db:studio
```

This opens a web interface at [http://localhost:5555](http://localhost:5555) where you can view and edit your database records.

### Create a new migration (after schema changes)

```bash
npm run db:migrate
```

---

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with Discord
- `POST /api/auth/signout` - Sign out

### Players
- `GET /api/players/claim` - Get current user's claimed players
- `POST /api/players/claim` - Claim a player profile
- `DELETE /api/players/[claimId]` - Unclaim a player

### Follows
- `POST /api/follows` - Follow a user
  - Body: `{ followingId: "user_id" }`
- `DELETE /api/follows/[followingId]` - Unfollow a user

### EA API (existing)
- `GET /api/ea/search-clubs` - Search for clubs
- `GET /api/ea/club-info` - Get club details
- `GET /api/ea/members` - Get club members
- `GET /api/ea/matches` - Get recent matches
- `GET /api/ea/player` - Get player stats

---

## Troubleshooting

### "Invalid client" error during Discord OAuth
- Double-check your `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`
- Make sure the redirect URI in Discord matches exactly: `http://localhost:3000/api/auth/callback/discord`

### Database connection errors
- Verify your `DATABASE_URL` is correct
- Make sure you've run `npm run db:push`
- Check that your Supabase project is active

### Console accounts not showing
- Make sure you've connected your console accounts in Discord Settings → Connections
- Try disconnecting and reconnecting the account in Discord
- Sign out and sign back in to refresh the connection data

### Player claiming fails
- Ensure your console username matches one of your Discord-connected accounts
- Ensure your EA player name matches your console username exactly (case-insensitive)
- Check that the Persona ID is correct

---

## Next Steps (Future Sessions)

- Session 2: Leagues, fixtures, and standings
- Session 3: Admin dashboard and league management
- Session 4: Real-time notifications and activity feed

---

## Architecture Overview

### Authentication Flow

1. User clicks "Sign In"
2. Redirected to Discord OAuth
3. User authorizes application
4. Discord returns user info + access token
5. Backend fetches Discord connections (PSN/Xbox/Battle.net)
6. User record created/updated in database
7. Session created
8. User redirected to homepage

### Player Claiming Flow

1. User submits claim form with console username + EA player name
2. Backend verifies console username matches Discord connection
3. Backend verifies EA player name matches console username
4. Backend checks persona ID isn't already claimed
5. Claim record created in database
6. Profile page refreshes to show claimed player

### Follow System

- Users can follow other users
- Followers/following counts shown on profiles
- Follow relationships stored in database with cascade deletion

---

## Database Schema

### User
- Stores Discord ID, username, discriminator, email, avatar hash
- Stores connected console usernames (PSN, Xbox, PC)
- Has many: claimed players, followers, following, accounts, sessions

### ClaimedPlayer
- Links user to EA player profile
- Stores platform, console username, player name, persona ID
- Stores current club info (if any)
- Unique constraint: one user can't claim same persona twice
- Unique constraint: one persona can't be claimed by multiple users

### Follow
- Many-to-many relationship between users
- Prevents self-following
- Unique constraint: can't follow same user twice

---

## Security Features

- NextAuth.js handles all authentication securely
- Discord OAuth with proper scopes (`identify`, `email`, `connections`)
- Protected routes via middleware
- API routes require authentication
- Player claiming requires verification (console username must match)
- Prevents duplicate claims
- Session-based authentication with database storage

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check the browser console and terminal for error messages
4. Ensure your Discord application is configured correctly
