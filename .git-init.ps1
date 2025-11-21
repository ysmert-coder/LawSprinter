# Git initialization script for LawSprinter
# Run this script from the project root directory

Write-Host "Initializing Git repository..." -ForegroundColor Green

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✓ Git repository already exists" -ForegroundColor Yellow
}

# Add remote if not exists
$remoteExists = git remote | Select-String "origin"
if (-not $remoteExists) {
    git remote add origin https://github.com/ysmert-coder/LawSprinter.git
    Write-Host "✓ Remote 'origin' added" -ForegroundColor Green
} else {
    Write-Host "✓ Remote 'origin' already exists" -ForegroundColor Yellow
}

# Stage all files
Write-Host "Staging files..." -ForegroundColor Green
git add .

# Commit
Write-Host "Creating commit..." -ForegroundColor Green
git commit -m "feat: Add RAG system + API routes + Frontend integration

- Add pgvector RAG system for legal documents
- Add case-assistant and strategy API routes  
- Connect frontend to new APIs
- Add Supabase Storage integration
- Update documentation"

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push -u origin main -f

Write-Host "`n✅ Deploy complete! Render will automatically deploy from GitHub." -ForegroundColor Green
Write-Host "Check status at: https://dashboard.render.com" -ForegroundColor Cyan

