# PhotoSearch v2 — Full Setup Guide

## Step 1 — Supabase project (5 minutes, free)

1. Go to https://supabase.com and click "Start your project"
2. Create a new project (any name, any region)
3. Wait ~2 minutes for it to provision

### Get your keys
Go to: Project Settings → API

Copy these three values:
- Project URL → paste as SUPABASE_URL (backend .env) and VITE_SUPABASE_URL (frontend .env)
- anon/public key → paste as SUPABASE_ANON_KEY and VITE_SUPABASE_ANON_KEY
- service_role key → paste as SUPABASE_SERVICE_KEY (backend only)

Go to: Project Settings → API → JWT Settings
- Copy JWT Secret → paste as JWT_SECRET in backend .env

---

## Step 2 — Enable Google OAuth in Supabase

1. In Supabase dashboard: Authentication → Providers → Google → Enable
2. Go to https://console.cloud.google.com
3. Create a new project (or use existing)
4. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs: add → https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   (find YOUR_PROJECT_REF in your Supabase URL)
7. Copy Client ID and Client Secret back into Supabase → Authentication → Google provider

---

## Step 3 — Install and run

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Features included

| Feature         | How to use                                      |
|-----------------|-------------------------------------------------|
| Sign in         | Click "Sign in with Google" on login page       |
| Upload photos   | Upload tab — drag & drop, CLIP processes each   |
| NLP Search      | Search tab — type anything in plain words       |
| Favorites       | Hover a photo → click the heart icon            |
| Albums          | Albums tab → New Album → add photos             |
| People          | People tab — auto-groups faces from your photos |
| Trash           | Hover a photo → trash icon → restore anytime    |
| Share link      | Hover a photo → share icon → link copied        |

---

## Deploying to public URL

### Frontend → Vercel
```bash
cd frontend
npm run build
npx vercel deploy
```
Add your env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) in Vercel dashboard.

### Backend → Render
1. Push repo to GitHub
2. render.com → New Web Service → connect repo
3. Root directory: backend
4. Build command: pip install -r requirements.txt
5. Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
6. Add all env vars from backend/.env in Render dashboard

Update VITE_SUPABASE_URL and frontend api.js baseURL to your live Render URL before deploying frontend.
Also update Supabase: Authentication → URL Configuration → add your Vercel URL to allowed redirect URLs.
