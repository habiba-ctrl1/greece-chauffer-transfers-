# Greece Chauffeur — Connection Test

Minimal Next.js (App Router, TypeScript) project used to verify the deployment stack: GitHub → Cloudflare Workers → D1.

## Local development

```bash
npm install
npm run dev
```

## Deployment

Deployed to Cloudflare Workers via [@opennextjs/cloudflare](https://opennext.js.org/cloudflare). The D1 database binding (`DB`) is configured in `wrangler.jsonc`.

```bash
npm run pages:build    # build for Cloudflare
npm run pages:deploy   # build + deploy
```
