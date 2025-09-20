#!/bin/bash

echo "🚀 GrowthKit Service Setup"
echo "========================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from .env.local..."
    cp .env.local .env
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
echo "Pushing schema to database..."
npm run db:push

echo ""
echo "🔧 Generating Prisma client..."
npm run db:generate

echo ""
echo "🌱 Seeding initial data..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Save the API key shown above"
echo "2. Start the dev server: npm run dev"
echo "3. Access admin panel: http://localhost:3000/admin"
echo ""
echo "Admin credentials:"
echo "  Username: fenixproduct"
echo "  Password: admin"
