#!/bin/bash

# LaTeX AI Writer v2 - Deployment Script
# This script helps prepare the project for Vercel deployment

echo "🚀 LaTeX AI Writer v2 - Deployment Preparation"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this script from the project root."
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found."
    exit 1
fi

# Check if api directory exists
if [ ! -d "vercel-api" ]; then
    echo "❌ Error: api directory not found."
    exit 1
fi

echo "✅ Project structure looks good!"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
if [ -f "frontend/package.json" ]; then
    npm install --prefix frontend
    if [ $? -eq 0 ]; then
        echo "✅ Frontend dependencies installed successfully"
    else
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "❌ Frontend package.json not found"
    exit 1
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build --prefix frontend
if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -f "env.example" ]; then
    echo "✅ Environment template found"
    echo "📝 Please make sure to set the following environment variables in Vercel:"
    echo "   - OPENAI_API_KEY"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
else
    echo "⚠️  Environment template not found"
fi

# Check if git is initialized
if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  You have uncommitted changes. Please commit them before deploying."
        echo "   Run: git add . && git commit -m 'Prepare for deployment'"
    else
        echo "✅ No uncommitted changes"
    fi
else
    echo "⚠️  Git repository not initialized"
    echo "   Run: git init && git add . && git commit -m 'Initial commit'"
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub:"
echo "   git remote add origin <your-github-repo-url>"
echo "   git push -u origin main"
echo ""
echo "2. Deploy to Vercel:"
echo "   - Go to https://vercel.com/dashboard"
echo "   - Click 'New Project'"
echo "   - Import your GitHub repository"
echo "   - Set environment variables"
echo "   - Deploy!"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
