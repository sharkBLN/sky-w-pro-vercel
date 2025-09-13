# 🚨 VERCEL DEPLOYMENT - ENVIRONMENT VARIABLES REQUIRED

## Quick Fix for Build Error

The build is failing because environment variables are missing. Here's how to fix it:

### 1. 🔧 Set Environment Variables in Vercel

In your Vercel dashboard, go to your project settings and add these environment variables:

**Required Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
CRON_SECRET_TOKEN=generate-a-secure-random-token
```

### 2. 🗄️ Create Supabase Project (if you haven't)

1. Go to https://supabase.com/dashboard
2. Create new project
3. Run the SQL from `supabase-schema.sql`
4. Get your keys from Settings → API
5. Create a storage bucket named `videos`

### 3. 🔑 Generate Secure Token

Run this to generate a secure cron token:
```bash
openssl rand -hex 32
```

### 4. 📝 Where to Add in Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar  
4. Add each variable with the values above
5. Click "Redeploy" or trigger a new deployment

### 5. ✅ After Setting Variables

Once you've added all environment variables in Vercel:
- Trigger a new deployment (it will rebuild automatically)
- The build should now succeed!

---

**The app won't work without these environment variables set in Vercel!** 🎯