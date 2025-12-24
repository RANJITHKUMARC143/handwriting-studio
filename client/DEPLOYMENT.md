# Frontend Deployment Guide

## Quick Start - Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free)
- Backend deployed to Railway (get the URL first)

### Step 1: Deploy Backend First
Before deploying the frontend, make sure your backend is deployed to Railway and you have the URL.

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard (Easiest)

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "Add New Project"**

3. **Import your GitHub repository**

4. **Configure the project:**
   - Framework: Next.js (auto-detected)
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Add Environment Variable:**
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend-url.railway.app
   ```
   (Replace with your actual Railway backend URL)

6. **Click "Deploy"**

7. **Done!** Your app will be live at `https://your-app.vercel.app`

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client directory
cd client

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Step 3: Configure Environment Variable

After deployment, add the backend URL:

1. Go to your project on Vercel
2. Click "Settings" → "Environment Variables"
3. Add:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-url.railway.app`
4. Redeploy (Vercel will auto-redeploy)

### Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Upload a test file
3. Generate a PDF
4. Download and verify

## Environment Variables

### Required

- `NEXT_PUBLIC_API_URL` - Your backend API URL from Railway

### Example

```
NEXT_PUBLIC_API_URL=https://text-to-handwriting-production.up.railway.app
```

## Troubleshooting

### "Failed to fetch" errors
- Check that `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running (visit the Railway URL)
- Check browser console for CORS errors

### Fonts not loading
- Fonts are loaded from Google Fonts CDN
- Check browser console for any blocked requests
- Verify internet connection

### PDF generation fails
- Check backend logs on Railway
- Verify Supabase is configured correctly
- Test backend API directly

## Custom Domain (Optional)

1. Go to Vercel project → "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatic

## Monitoring

- **Analytics**: Vercel Dashboard → Analytics
- **Logs**: Vercel Dashboard → Functions → Logs
- **Performance**: Vercel Dashboard → Speed Insights

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

---

## 🎉 Your App is Live!

After deployment, share your app:
- Production URL: `https://your-app.vercel.app`
- Custom domain: `https://yourdomain.com` (if configured)

Enjoy! 🚀
