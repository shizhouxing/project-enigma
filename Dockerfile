# Stage 1: Install Python dependencies for FastAPI
FROM python:3.9-slim AS backend
WORKDIR /app

# Copy Python dependencies and install them
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY api/ /app/api/

# Create and activate virtual environment
RUN python3 -m venv /app/.venv
RUN source /app/.venv/bin/activate && pip install --no-cache-dir -r requirements.txt

# Expose the FastAPI port
EXPOSE 8000

# Command to run FastAPI
CMD ["source /app/.venv/bin/activate && uvicorn api.main:app --host 0.0.0.0 --port 8000"]
