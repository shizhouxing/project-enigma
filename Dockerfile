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

# Install Python in the final image
RUN apk add --no-cache python3 py3-pip

# Copy both backend and frontend files
COPY --from=backend /app /app
COPY --from=frontend /app /app

# Create and activate virtual environment
RUN python3 -m venv .venv

# Install requirements in the virtual environment
RUN source .venv/bin/activate && \
    pip install --no-cache-dir -r requirements.txt

# Install additional dev tools for the final container
RUN npm install -g concurrently
RUN npm run build

# Expose ports for development
EXPOSE 3000 8000

# Use a shell to activate the virtual environment and then run the commands
CMD [ "source .venv/bin/activate && npx concurrently /"npm start/" /"npm run fastapi-dev/"" ]

# Copy the entrypoint script and make it executable
COPY scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Use the shell script as the container's entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]