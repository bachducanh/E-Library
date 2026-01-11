# Quick Start Script for E-Library

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "E-Library Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`nChecking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Start MongoDB cluster
Write-Host "`nStarting MongoDB cluster..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "`nWaiting for containers to be healthy (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check container status
Write-Host "`nContainer status:" -ForegroundColor Yellow
docker-compose ps

# Initialize sharding
Write-Host "`nInitializing MongoDB sharding..." -ForegroundColor Yellow
docker exec -i mongos1 mongosh --port 27020 < scripts/init-sharding.js

# Create indexes
Write-Host "`nCreating indexes..." -ForegroundColor Yellow
docker exec -i mongos1 mongosh --port 27020 elibrary < scripts/create-indexes.js

# Check if Python is available
Write-Host "`nChecking Python..." -ForegroundColor Yellow
try {
    python --version
    Write-Host "✓ Python is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host "`nInstalling backend dependencies..." -ForegroundColor Yellow
Set-Location backend
pip install -r requirements.txt -q
Set-Location ..

# Seed database
Write-Host "`nSeeding database (this may take 3-5 minutes)..." -ForegroundColor Yellow
python scripts/seed-data.py

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Start backend:  cd backend && uvicorn main:app --reload" -ForegroundColor White
Write-Host "2. Start frontend: cd frontend && npm install && npm run dev" -ForegroundColor White
Write-Host "`nDefault credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin@elibrary.vn / admin123" -ForegroundColor White
Write-Host "  Member: member1@example.com / password123" -ForegroundColor White
Write-Host "`nURLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  MongoDB:  mongodb://localhost:27020/" -ForegroundColor White
