#!/bin/bash

# Setup script for GrowthKit development

echo "🚀 Setting up GrowthKit development environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy
npx prisma generate

# 2. Build SDK
echo -e "${YELLOW}Building SDK...${NC}"
cd sdk
npm install
npm run build
cd ..

# 3. Link SDK locally
echo -e "${YELLOW}Setting up local SDK link...${NC}"
cd sdk
npm link
cd ../example-app
npm link @growthkit/sdk
cd ..

# 4. Install example app dependencies
echo -e "${YELLOW}Installing example app dependencies...${NC}"
cd example-app
npm install
cd ..

# 5. Check for .env.local files
echo -e "${YELLOW}Checking environment files...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local from .env.example...${NC}"
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual database URL and other settings"
fi

if [ ! -f "example-app/.env.local" ]; then
    echo -e "${YELLOW}Creating example-app/.env.local from env.example...${NC}"
    cp example-app/env.example example-app/.env.local
    echo "⚠️  Please update example-app/.env.local with your actual API key"
fi

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.local files with your actual values"
echo "2. Run 'npm run dev' to start the GrowthKit server"
echo "3. In another terminal, run 'cd sdk && npm run dev' to watch SDK changes"
echo "4. In another terminal, run 'cd example-app && npm run dev' to start the example app"
echo ""
echo "The example app will be available at http://localhost:3001"
