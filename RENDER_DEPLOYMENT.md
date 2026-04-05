# MBIOPAY Render Deployment Guide

## Repository

- **GitHub**: [https://github.com/Kemlive/MBIOPAY](https://github.com/Kemlive/MBIOPAY)
- **Branch**: `main`

## Deployment Changes Made

### 1. Removed Replit-Specific Dependencies
Removed from all frontend packages:
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner`
- `@replit/vite-plugin-runtime-error-modal`

**Files Updated**:
- `artifacts/app-ui/package.json`
- `artifacts/admin-ui/package.json`
- `artifacts/remittance-ui/package.json`
- `artifacts/mockup-sandbox/package.json`

### 2. Cleaned Vite Configs
Removed all Replit-specific plugin initialization and port validation.

**Files Updated**:
- `artifacts/app-ui/vite.config.ts`
- `artifacts/admin-ui/vite.config.ts`
- `artifacts/remittance-ui/vite.config.ts`
- `artifacts/mockup-sandbox/vite.config.ts`

### 3. Fixed Backend Start Script
Removed Replit-specific `fuser` command that kills ports on startup:

**Before**:
```bash
"start": "fuser -k ${PORT}/tcp 2>/dev/null; sleep 0.5; node --enable-source-maps ./dist/index.mjs"
```

**After**:
```bash
"start": "node --enable-source-maps ./dist/index.mjs"
```

**File**: `artifacts/api-server/package.json`

### 4. Updated Workspace Config
Cleaned `pnpm-workspace.yaml` to remove Replit catalog entries.

### 5. Added Render Deployment Manifest
Created `render.yaml` with:
- **Service**: `mbiopay-api-server` (Node.js backend)
- **Static Sites**:
  - `mbiopay-app-ui` (main app)
  - `mbiopay-admin-ui` (admin dashboard)
  - `mbiopay-remittance-ui` (remittance portal)

## Next Steps: Deploy to Render

### 1. Connect GitHub to Render
1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **+ New**
3. Select **Web Service** or **Static Site**
4. Select **GitHub** as the repository source
5. Authorize and select `Kemlive/MBIOPAY`

### 2. For Backend (API Server)
- Repository: `Kemlive/MBIOPAY`
- Branch: `main`
- Build Command: `pnpm install && pnpm --dir artifacts/api-server build`
- Start Command: `pnpm --dir artifacts/api-server start`
- Environment: Node
- Plan: Free (or suitable tier)

Render will use `render.yaml` for automatic service detection.

### 3. For Frontends (Static Sites)
Each frontend will auto-deploy as a **Static Site**:
- Build Command: `pnpm install && pnpm --dir artifacts/<name> build`
- Publish Directory: `artifacts/<name>/dist`
- Auto-deployed from `render.yaml`

### 4. Environment Variables
Set in Render environment settings:
- `PORT` (set to 3000 for backend)
- `NODE_ENV` (set to `production`)
- Database URLs (if applicable)
- API keys and secrets

### 5. Deploy from GitHub
```bash
git push origin main
```

Render will automatically detect changes and redeploy.

## Workspace Scripts (Root)

After setup on Render, use locally:

```bash
# Build all
pnpm build

# Build backend only
pnpm build:api

# Build frontend only
pnpm build:app

# Start backend
pnpm start
```

## Notes

- Lock file (`pnpm-lock.yaml`) will be regenerated on Render during first build
- All Replit-specific references have been removed for cross-platform compatibility
- Frontends deploy as static sites; backend as Node.js web service
- Free tier suitable for development/testing; upgrade as needed for production

---

**Last Updated**: April 5, 2026
