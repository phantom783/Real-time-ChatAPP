#!/bin/bash
# Chat Application Startup Script

set -e

echo "================================"
echo "Chat App - Development Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js v14+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js ${NC}$(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm is not installed. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo ""

# Setup frontend
echo -e "${BLUE}Setting up Frontend...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "Frontend dependencies already installed"
fi

# Setup environment file
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from .env.example"
    cp .env.example .env.local
    echo -e "${YELLOW}⚠ Update .env.local with your configuration${NC}"
fi

echo -e "${GREEN}✓ Frontend ready${NC}"
echo ""

# Setup backend
echo -e "${BLUE}Setting up Backend...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "Backend dependencies already installed"
fi

# Setup backend environment file
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example"
    cp .env.example .env
    echo -e "${YELLOW}⚠ Update backend/.env with your configuration${NC}"
fi

echo -e "${GREEN}✓ Backend ready${NC}"
echo ""

cd ..

# Summary
echo "================================"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "================================"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update .env.local (Frontend configuration)"
echo "2. Update backend/.env (Backend configuration)"
echo "3. Ensure MongoDB is running"
echo ""
echo -e "${BLUE}To start development:${NC}"
echo "Terminal 1: cd backend && npm run dev"
echo "Terminal 2: npm run dev"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo ""
