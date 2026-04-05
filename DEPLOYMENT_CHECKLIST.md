# MBIO-App Render Deployment Checklist

## Repository
- **GitHub**: https://github.com/MBIO1/MBIOPAY
- **Branch**: main

## Pre-Deployment Checks

- [x] Removed all Replit-specific dependencies and plugins
- [x] Updated Vite configs to remove Replit-only features
- [x] Fixed backend start script (removed fuser port-kill)
- [x] Created render.yaml with all services defined
- [x] Updated root package.json build script
- [x] Configured pnpm-workspace.yaml
- [x] Added TypeScript configuration with workspace references

## Render Services to Deploy

### 1. API Server (Web Service)
```yaml
Service: mbiopay-api-server
Type: Web Service
Environment: Node
Plan: Free (upgrade if needed)
Branch: main
Build: corepack enable && pnpm install --no-frozen-lockfile --prod=false && pnpm run typecheck && pnpm --dir artifacts/api-server build
Start: pnpm --dir artifacts/api-server start
Health Check: /api/healthz
Port: 3000 (set via PORT env var)
```

### 2. App UI (Static Site)
```yaml
Service: mbiopay-app-ui
Type: Static Site
Plan: Free (upgrade if needed)
Branch: main
Build: corepack enable && pnpm install --no-frozen-lockfile --prod=false && pnpm run typecheck && pnpm --dir artifacts/app-ui build
Publish: artifacts/app-ui/dist/public
```

### 3. Admin UI (Static Site)
```yaml
Service: mbiopay-admin-ui
Type: Static Site
Plan: Free (upgrade if needed)
Branch: main
Build: corepack enable && pnpm install --no-frozen-lockfile --prod=false && pnpm run typecheck && pnpm --dir artifacts/admin-ui build
Publish: artifacts/admin-ui/dist/public
```

### 4. Remittance UI (Static Site)
```yaml
Service: mbiopay-remittance-ui
Type: Static Site
Plan: Free (upgrade if needed)
Branch: main
Build: corepack enable && pnpm install --no-frozen-lockfile --prod=false && pnpm run typecheck && pnpm --dir artifacts/remittance-ui build
Publish: artifacts/remittance-ui/dist/public
```

## Environment Variables (Set in Render Dashboard)

**For API Server:**
- `PORT=3000`
- `NODE_ENV=production`
- `DATABASE_URL` for Postgres
- `MONGODB_URI` if Mongo-backed features should be enabled
- `ADMIN_SECRET` or `SESSION_SECRET`
- `CORS_ALLOWED_ORIGINS` for any non-default frontend domains
- API keys / secrets
- Any other runtime environment variables from `.env`

## Deployment Steps

1. Visit https://dashboard.render.com
2. Click **+ New**
3. Select **Web Service** for API server
4. Connect to GitHub > Select `MBIO1/MBIOPAY`
5. Configure build/start commands (use values above)
6. Set environment variables
7. Deploy

Render will auto-detect `render.yaml` for static sites.

## Troubleshooting

**Build fails with dependency or workspace errors:**
- Ensure `corepack enable` runs before `pnpm`
- Ensure `pnpm install --no-frozen-lockfile --prod=false` is used
- Check that all workspace references in tsconfig.json are present
- Verify git push includes all needed files

**Backend boots but returns limited functionality:**
- Confirm `DATABASE_URL` is set or DB-backed routes will fail at request time
- Confirm `MONGODB_URI` is set if visit tracking is expected
- Confirm wallet and Flutterwave secrets are set for payout flows

**Missing dependencies:**
- Always use `--prod=false`; use `--no-frozen-lockfile` if the lockfile is stale
- Catalog dependencies must be in pnpm-workspace.yaml

## Local Build

To test builds locally:
```bash
chmod +x build.sh
./build.sh
```

## File Structure
```
MBIO-App/
├── artifacts/
│   ├── api-server/       # Node.js backend
│   ├── app-ui/           # Main React app
│   ├── admin-ui/         # Admin dashboard
│   └── remittance-ui/    # Remittance portal
├── lib/
│   ├── db/               # Database layer
│   ├── api-zod/          # API validation
│   └── api-client-react/ # React API client
├── render.yaml           # Render deployment manifest
├── package.json          # Root workspace config
├── pnpm-workspace.yaml   # pnpm monorepo config
└── tsconfig.json         # Root TypeScript config
```

---
**Last Updated**: April 5, 2026
**Status**: Hardened for Render deployment
