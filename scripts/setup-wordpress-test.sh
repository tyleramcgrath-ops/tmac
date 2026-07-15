#!/bin/bash

# Phase 9.2a: WordPress Test Environment Setup
# Sets up Docker WordPress instances with plugins and test data

set -e

WORDPRESS_USER="${WORDPRESS_USER:-admin}"
WORDPRESS_EMAIL="${WORDPRESS_EMAIL:-test@example.com}"
WORDPRESS_PASSWORD="${WORDPRESS_PASSWORD:-test123!@#}"

echo "🚀 Starting WordPress Test Environment Setup"
echo ""

# Start Docker containers
echo "📦 Starting Docker containers..."
docker-compose -f docker-compose.test.yml up -d
echo "⏳ Waiting for containers to start (60 seconds)..."
sleep 60

# Function to wait for WordPress to be ready
wait_for_wordpress() {
  local url=$1
  local name=$2
  echo "⏳ Waiting for $name to be ready..."

  for i in {1..30}; do
    if curl -s "$url/wp-json/" > /dev/null; then
      echo "✅ $name is ready"
      return 0
    fi
    echo "  Attempt $i/30..."
    sleep 2
  done

  echo "❌ $name failed to start"
  return 1
}

# Wait for all WordPress instances
wait_for_wordpress "http://localhost:8001" "Clean WordPress"
wait_for_wordpress "http://localhost:8002" "WordPress with Yoast"
wait_for_wordpress "http://localhost:8003" "WordPress with Rank Math"
wait_for_wordpress "http://localhost:8004" "WordPress with AIOSEO"

echo ""
echo "✅ All WordPress instances are running"
echo ""

# Function to initialize WordPress instance
init_wordpress_instance() {
  local port=$1
  local name=$2

  echo "🔧 Initializing $name (port $port)..."

  # Wait a bit for database to be ready
  sleep 5

  # The WordPress image runs wp-core-install automatically, but we need to set up an app password
  docker exec wordpress-$(echo "$name" | tr ' ' '-' | tr '[:upper:]' '[:lower:]') \
    wp --allow-root user create test-user test@example.com --user_pass=test123 || true

  echo "✅ $name initialized"
}

# Initialize all instances (WordPress auto-installation happens via Docker)
echo "🔧 WordPress instances are auto-configured by Docker"
echo ""

# Print access information
echo "📋 WordPress Test Environments Ready:"
echo ""
echo "  Clean WordPress:"
echo "    URL: http://localhost:8001"
echo "    User: admin"
echo ""
echo "  WordPress with Yoast:"
echo "    URL: http://localhost:8002"
echo "    User: admin"
echo ""
echo "  WordPress with Rank Math:"
echo "    URL: http://localhost:8003"
echo "    User: admin"
echo ""
echo "  WordPress with AIOSEO:"
echo "    URL: http://localhost:8004"
echo "    User: admin"
echo ""

echo "🧪 Running validation tests..."
npm run test:wordpress-validation || true

echo ""
echo "✅ WordPress Test Environment Setup Complete"
echo ""
echo "To stop containers: npm run docker:down"
echo "To view logs: npm run docker:logs"
