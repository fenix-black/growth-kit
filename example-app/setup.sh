#!/bin/bash

echo "🚀 GrowthKit Test App Setup"
echo "=========================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local already exists"
else
    echo "📝 Creating .env.local file..."
    
    # Copy from env.example
    cp env.example .env.local
    
    echo ""
    echo "⚠️  Please edit .env.local and add your GROWTHKIT_API_KEY"
    echo "   You can get an API key from the GrowthKit admin dashboard"
    echo ""
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the test app, run:"
echo "  npm run dev"
echo ""
echo "The app will be available at http://localhost:3001"
echo ""
echo "Don't forget to set your GROWTHKIT_API_KEY in .env.local!"
