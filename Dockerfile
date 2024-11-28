# Stage 1: Install Python dependencies for FastAPI
FROM python:3.9-slim AS backend
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ /app/api/

# Stage 2: Install Node.js dependencies for Next.js
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Stage 3: Final container for development
FROM node:18-alpine
WORKDIR /app

# Copy both backend and frontend files
COPY --from=backend /app /app
COPY --from=frontend /app /app

# Install additional dev tools for the final container
RUN npm install -g concurrently

RUN npm run build
# Expose ports for development
EXPOSE 3000 51234

# Use the dev script for both servers
CMD ["npx", "concurrently", "\"npm start\"", "\"npm run fastapi-dev\""]

