FROM python:3.12.11-slim-bullseye

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements (if exists) and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Copy NGINX config
COPY conf.d/app.conf /etc/nginx/nginx.conf

# Remove default NGINX site config if exists
RUN rm -f /etc/nginx/sites-enabled/default

# Expose ports (80 for NGINX)
EXPOSE 443

# Create Gunicorn start script
RUN echo '#!/bin/sh\n\
cd /app/backend_testbed && service nginx start && gunicorn --worker-class eventlet -w 1 myapp:app --bind 0.0.0.0:5000' > /start-gunicorn.sh && \
    chmod +x /start-gunicorn.sh

# Create supervisor script to run both NGINX and Gunicorn
SHELL ["/bin/bash", "-c"]
ENTRYPOINT ["/start-gunicorn.sh"]

# Healthcheck (optional)
HEALTHCHECK CMD curl --fail http://localhost/ || exit 1