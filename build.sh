#!/bin/bash

# MBIO-App Build Script for Render
# This script builds all artifacts in the correct order

set -e

echo "🔨 Building MBIO-App..."
echo "========================"

# Install dependencies with dev packages
echo "📦 Installing dependencies..."
pnpm install --prod=false

# Build workspace libraries first
echo "📚 Building workspace libraries..."
pnpm run typecheck:libs

# Build API Server
echo "🚀 Building API Server..."
pnpm --dir artifacts/api-server build

# Build Frontends
echo "🎨 Building App UI..."
pnpm --dir artifacts/app-ui build

echo "🔐 Building Admin UI..."
pnpm --dir artifacts/admin-ui build

echo "💸 Building Remittance UI..."
pnpm --dir artifacts/remittance-ui build

echo ""
echo "✅ Build complete!"
echo "========================"
echo ""
echo "Generated artifacts:"
echo "  - API: artifacts/api-server/dist"
echo "  - App UI: artifacts/app-ui/dist"
echo "  - Admin UI: artifacts/admin-ui/dist"
echo "  - Remittance UI: artifacts/remittance-ui/dist"
