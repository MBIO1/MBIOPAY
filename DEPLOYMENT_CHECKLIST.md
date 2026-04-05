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
Build: pnpm install --prod=false && pnpm --dir artifacts/api-server build
Start: pnpm --dir artifacts/api-server start
Port: 3000 (set via PORT env var)
```

### 2. App UI (Static Site)
```yaml
Service: mbiopay-app-ui
Type: Static Site
Plan: Free (upgrade if needed)
Branch: main
Build: pnpm install --prod=false && pnpm --dir artifacts/app-ui build
Publish: artifacts/app-ui/dist
```

### 3. Admin UI (Static Site)
```yaml
Service: mbiopay-admin-ui
Type: Static Site
Plan: Free (upgrade if needed)
Branch: main
Build: pnpm install --prod=false && pnpm --dir artifacts/admin-ui build
Publish: artifacts/admin-ui/dist
```

### 4. Remittance UI (Static Site)
```yaml
Service: mbiopay-remittance-ui
Type: Static Site
Plan: Free (upgrade if needed)
Branch: main
Build: pnpm install --prod=false && pnpm --dir artifacts/remittance-ui build
Publish: artifacts/remittance-ui/dist
```

## Environment Variables (Set in Render Dashboard)

**For API Server:**
- `PORT=3000`
- `NODE_ENV=production`
- Database URLs (if applicable)
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

**Build fails with TypeScript errors:**
- Ensure `pnpm install --prod=false` is used
- Check that all workspace references in tsconfig.json are present
- Verify git push includes all needed files

**Port conflicts:**
- Set `PORT` environment variable in Render dashboard
- Backend uses PORT from env or defaults to 3000

**Missing dependencies:**
- Always use `--prod=false` flag for dev dependencies
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
**Status**: Ready for Render deployment
