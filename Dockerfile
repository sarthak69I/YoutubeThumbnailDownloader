# Multi-stage Dockerfile for E-LEAKxDOWN on Render

# Stage 1: Next.js Frontend Build
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM python:3.11-slim AS production

# Install system dependencies for yt-dlp and FFmpeg
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for Next.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy Python requirements and install
COPY pyproject.toml ./
RUN pip install --no-cache-dir flask gunicorn yt-dlp requests email-validator flask-sqlalchemy psycopg2-binary

# Copy Flask backend
COPY app.py main.py ./
COPY static static/
COPY templates templates/

# Copy Next.js build from frontend stage
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/next.config.js ./

# Install only production Node.js dependencies
RUN npm ci --only=production

# Create startup script
RUN echo '#!/bin/bash\n\
# Start Flask backend in background\n\
python main.py &\n\
FLASK_PID=$!\n\
\n\
# Start Next.js frontend\n\
npm start &\n\
NEXT_PID=$!\n\
\n\
# Wait for any process to exit\n\
wait -n\n\
\n\
# Exit with status of process that exited first\n\
exit $?' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000
EXPOSE 5000

CMD ["/app/start.sh"]