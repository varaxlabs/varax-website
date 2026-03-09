#!/bin/sh
if [ "$DEPLOY_MODE" = "full" ]; then
  echo "Building full site"
  npm run build
else
  echo "Deploying coming soon page"
  mkdir -p dist
  cp -r coming-soon/* dist/
fi
