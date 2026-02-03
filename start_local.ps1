Write-Host "Starting Aqua AI Locally (SQLite Mode)..."

# Check if dev.sqlite3 exists
if (-not (Test-Path "backend/dev.sqlite3")) {
    Write-Host "Database not found. Running migrations..."
    Set-Location "backend"
    npx knex migrate:latest
    Set-Location ".."
}

# Start Backend
Write-Host "Starting Backend in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start Frontend
Write-Host "Starting Frontend in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host "Services started. Backend on port 5000, Frontend on port 3000."
