# Docker Setup Guide for URL Shortener

This guide will help you build and push the URL shortener Docker image to Docker Hub.

## Prerequisites

1. **Docker Desktop must be running**
   - Open Docker Desktop application
   - Wait for it to fully start (you'll see the Docker icon in your system tray)

## Build the Docker Image

Once Docker Desktop is running, execute these commands in order:

### 1. Build the Image

```bash
docker build -t mahmoudyasser76/url-shortener:latest .
```

This will:

- Use the `Dockerfile` to create the image
- Install Node.js dependencies
- Copy application files
- Tag the image as `mahmoudyasser76/url-shortener:latest`

### 2. Test the Image Locally (Optional but Recommended)

```bash
docker run -d -p 3000:3000 --name url-shortener-test mahmoudyasser76/url-shortener:latest
```

Then visit `http://localhost:3000` to verify it works.

To stop and remove the test container:

```bash
docker stop url-shortener-test
docker rm url-shortener-test
```

### 3. Login to Docker Hub

```bash
docker login
```

Enter your credentials:

- Username: `mahmoudyasser76`
- Password: (your Docker Hub password or access token)

### 4. Push the Image to Docker Hub

```bash
docker push mahmoudyasser76/url-shortener:latest
```

This will upload the image to: `https://hub.docker.com/r/mahmoudyasser76/url-shortener`

## Using Docker Compose

Alternatively, you can use docker-compose to build and run:

```bash
# Build and start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

## Pull and Run from Docker Hub (After Pushing)

Anyone can pull and run your image:

```bash
docker pull mahmoudyasser76/url-shortener:latest
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data mahmoudyasser76/url-shortener:latest
```

## Files Created

- **Dockerfile** - Container build instructions
- **docker-compose.yml** - Service orchestration
- **.dockerignore** - Files to exclude from image
- **database.js** - Updated to support Docker environment variables

## Environment Variables

- `DB_PATH` - Database file path (default: `/app/data/urls.db`)
- `NODE_ENV` - Node environment (set to `production` in docker-compose)

## Volume Mapping

The docker-compose.yml maps `./data` to `/app/data` for persistent database storage across container restarts.
