# Use an official Python runtime as a parent image
# We choose a slim version for smaller image size, suitable for production
FROM python:3.10-slim-buster

# Set the working directory in the container
# This is where your application code will reside
WORKDIR /app

# Install system dependencies required for psycopg2 (PostgreSQL adapter)
# and other potential build tools.
# apt-get update: Updates the list of available packages
# apt-get install -y: Installs packages without asking for confirmation
# build-essential: Provides essential tools for compiling software
# libpq-dev: Development files for PostgreSQL client library (needed by psycopg2)
# gcc: GNU C compiler (often part of build-essential, but good to be explicit)
# python3-dev: Header files for Python (often needed for C extensions like psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    python3-dev \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy the requirements.txt file into the container
# This allows Docker to cache the dependency installation layer
COPY ./requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
# --no-cache-dir: Prevents pip from storing downloaded packages, saving space
# --upgrade pip: Ensures pip is up-to-date
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy the entire backend application code into the container
# The first /app/backend is the destination inside the container
# The second . is the source (current directory, which is /app)
# This copies your backend folder content into /app/backend
COPY ./backend /app/backend

# Set the PYTHONPATH to include the /app directory
# This is crucial for absolute imports like 'from backend.database import ...'
ENV PYTHONPATH=/app

# Expose the port that FastAPI will run on
# FastAPI typically runs on port 8000 by default
EXPOSE 8000

# Command to run the application using Uvicorn
# --host 0.0.0.0: Makes the server accessible from outside the container
# --port 8000: Specifies the port
# backend.main: Refers to the 'main' FastAPI app object inside 'backend' module
# --reload: REMOVE THIS FOR PRODUCTION. It's for development only.
# For production, you'd typically run with more workers and without --reload
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
