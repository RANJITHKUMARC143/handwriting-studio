#!/bin/bash

echo "🚀 Setting up Text-to-Handwriting Server..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql"
    exit 1
fi

# Check if Redis is installed
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis is not installed. Please install it first:"
    echo "   macOS: brew install redis"
    echo "   Ubuntu: sudo apt-get install redis-server"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Create database
echo "📊 Creating PostgreSQL database..."
createdb handwriting 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database 'handwriting' created successfully"
else
    echo "ℹ️  Database 'handwriting' may already exist"
fi

# Start Redis if not running
echo "🔄 Checking Redis..."
redis-cli ping &> /dev/null
if [ $? -ne 0 ]; then
    echo "Starting Redis..."
    redis-server --daemonize yes
    echo "✅ Redis started"
else
    echo "✅ Redis is already running"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads/temp
mkdir -p output
echo "✅ Directories created"

echo ""
echo "✅ Setup complete! You can now run:"
echo "   npm run dev"
