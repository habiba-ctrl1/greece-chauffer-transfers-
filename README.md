# Greece Chauffeur — Connection Test

Minimal Next.js (App Router, TypeScript) project used to verify the deployment stack: GitHub → Vercel → Supabase.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key |

Both are public (client-safe) values. Never commit `.env`, `.env.local`, or a service-role key.
