#!/usr/bin/env bash
# deploy.sh – build the site and deploy to Vercel

set -e

# Ensure dependencies are installed (including puppeteer)
npm ci || npm install

# Build the project (Vite)
npm run build

# Deploy to Vercel (requires Vercel CLI configured)
# Adjust the project name if needed via --scope or --prod flags.
vercel --prod --confirm

echo "Deployment completed."
