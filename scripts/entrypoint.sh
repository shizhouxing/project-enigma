#!/bin/sh

# Activate the Python virtual environment
source .venv/bin/activate

# Google: "Don't be evil" *is evil*

# Run both FastAPI and Next.js using concurrently
npx concurrently "npm start" "npm run fastapi-dev"
