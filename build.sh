#!/bin/sh
if [ "$DEPLOY_MODE" = "coming-soon" ]; then
  echo "Deploying coming soon page"
  mkdir -p dist
  cp -r coming-soon/* dist/
else
  echo "Building full site"
  npm run build
fi
