# NightWatch Pro - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Step 1: GitHub Repository ✅
Repository is already created at: https://github.com/sharkBLN/sky-w-pro-vercel

### Step 2: Vercel Deployment

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Import Project**: Click "Add New..." → "Project"
3. **Import from GitHub**: Select `sharkBLN/sky-w-pro-vercel`
4. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 3: Environment Variables

Add these environment variables in Vercel dashboard:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Settings  
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
CRON_SECRET_TOKEN=your_secure_random_token_for_cron_endpoints
```

### Step 4: Supabase Setup

1. **Create Supabase Project**: https://supabase.com/dashboard
2. **Run Database Schema**: Execute the SQL in `supabase-schema.sql`
3. **Storage Bucket**: Create a public bucket named `videos`
4. **Get Environment Variables**: 
   - Project URL from Settings → API
   - Anon key from Settings → API  
   - Service role key from Settings → API

### Step 5: Deploy

1. Click **Deploy** in Vercel
2. Wait for build to complete
3. Visit your app URL

---

## 🔧 Manual Deployment Steps

If you prefer manual setup:

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

### Build and Deploy
```bash
# Build for production
npm run build

# Deploy to Vercel (requires Vercel CLI)
npx vercel --prod
```

---

## 📋 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) | Yes |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL | Yes |
| `CRON_SECRET_TOKEN` | Secret token for cron endpoints | Yes |

---

## 🗄️ Database Schema

The `supabase-schema.sql` file contains:
- **batches** table: Upload batch management
- **videos** table: Video file metadata
- **events** table: Detected events/objects
- **Row Level Security (RLS)**: Permissive policies for demo

---

## ✅ Post-Deployment Checklist

- [ ] App loads successfully at deployed URL
- [ ] Multi-upload component accepts files
- [ ] Batch creation works
- [ ] Video player displays uploaded videos
- [ ] Event timeline markers appear
- [ ] Audio controls work (mute/unmute/volume)
- [ ] Supabase storage bucket receives files
- [ ] Database tables populate with data

---

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**: Check TypeScript errors in build logs
2. **Environment Variables**: Verify all vars are set in Vercel dashboard
3. **Supabase Connection**: Test database connection and API keys
4. **File Uploads**: Check Supabase storage bucket permissions
5. **Audio Issues**: Browser autoplay policies may block audio

### Debug Steps

1. Check Vercel build logs
2. Verify environment variables in Vercel dashboard  
3. Test Supabase connection in browser dev tools
4. Check browser console for client-side errors
5. Review Supabase logs for server errors

---

## 📞 Support

For issues or questions:
- Check the README.md for feature documentation
- Review browser console for error messages
- Check Vercel deployment logs
- Test locally with `npm run dev`

---

**Next Step**: Deploy to Vercel using the GitHub repository! 🎯