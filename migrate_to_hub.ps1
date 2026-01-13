# PowerShell Script to Migrate Games to tamilgaminghub

# 1. Define Paths
$currentDir = Get-Location
$sourceGamesDir = Join-Path $currentDir "games"
# Assuming we are in d:\git_projects\neelakandanz.github.io\neelakandanz.github.io
# We want d:\git_projects\tamilgaminghub
# So we need to go up two levels? 
# Let's check structure:
# Workspace: d:\git_projects\neelakandanz.github.io\neelakandanz.github.io
# Project Root seems to be the workspace.
# User likely wants D:\git_projects\tamilgaminghub

$destinationBase = Join-Path (Split-Path (Split-Path $currentDir -Parent) -Parent) "tamilgaminghub" 

# Alternative: Just ask user where, or assume sibling to the repo folder.
# Let's assume sibling to the 'neelakandanz.github.io' REPO folder.
# If current is repo/repo (nested), then it's correct to go up twice.
# If current is repo level, go up once.
# Let's try to be safe and define it relative to the drive if possible, or just print it.

Write-Host "Current Directory: $currentDir"
Write-Host "Target Directory: $destinationBase"

# 2. Create Target Directory
if (-not (Test-Path $destinationBase)) {
    Write-Host "Creating target directory..."
    New-Item -ItemType Directory -Force -Path $destinationBase
}

# 3. Move Games
$games = @("dayakattam-3d", "tamil-letter-catch-3d", "pallanguzhi-3d")

foreach ($game in $games) {
    $src = Join-Path $sourceGamesDir $game
    $dest = Join-Path $destinationBase $game
    
    if (Test-Path $src) {
        Write-Host "Moving $game to $dest..."
        Move-Item -Path $src -Destination $dest -Force
    } else {
        Write-Host "Warning: $game not found in games folder."
    }
}

Write-Host "Migration Complete!"
Write-Host "Please open '$destinationBase' in VS Code to continue working on the games."
