# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY api/requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY api/ /app/api/

# Expose the port your application will run on (default for Uvicorn is 8000)
EXPOSE 8000

# Set the default command to run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "api", "--workers", "4"]
