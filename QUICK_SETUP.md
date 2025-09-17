# 🚀 Aqua-AI Quick Setup Guide

## Current Status
✅ Frontend - Ready (React app built successfully)  
✅ Backend - Dependencies installed  
✅ Environment variables - Configured  
❌ Database - Need to install PostgreSQL  
❌ Python - Need to install for AI models  

## Option 1: Full Setup (Recommended for Complete Development)

### 1. Install PostgreSQL
Download and install PostgreSQL from: https://www.postgresql.org/download/windows/
- Include PostgreSQL, pgAdmin, and command-line tools
- Remember the password you set for the postgres user

After installation, create the database:
```sql
-- Connect to PostgreSQL as postgres user
CREATE DATABASE aqua_ai_db;
CREATE USER aqua_ai WITH PASSWORD 'aqua_password';
GRANT ALL PRIVILEGES ON DATABASE aqua_ai_db TO aqua_ai;
-- Enable PostGIS extension (for geographic data)
\c aqua_ai_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. Install Python
Download Python 3.8+ from: https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### 3. Initialize Database Schema
```bash
cd database
# Run the schema setup (once PostgreSQL is installed)
psql -U aqua_ai -d aqua_ai_db -f schema.sql
```

## Option 2: Quick Demo Setup (For Immediate Testing)

If you want to run the app quickly without full database setup, we can use SQLite as a temporary database:

### 1. Update Backend for SQLite (Demo Mode)
```bash
cd backend
npm install sqlite3
```

### 2. Run the Application
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend  
cd frontend
npm start
```

The app will run with:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Mock data for demonstration

## Option 3: Docker Setup (Easiest)

If you have Docker installed:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database with PostGIS
- Backend API server
- Frontend development server

## Next Steps After Setup

1. **Test the connection**:
   ```bash
   cd backend
   npm run test
   ```

2. **Access the application**:
   - Open http://localhost:3000 in your browser
   - The interactive map should load with sample water quality data

3. **API Endpoints**:
   - Health check: http://localhost:5000/api/health
   - Water quality data: http://localhost:5000/api/water-quality
   - Locations: http://localhost:5000/api/locations

## Troubleshooting

### Common Issues:
1. **Port conflicts**: Make sure ports 3000 and 5000 are available
2. **Database connection**: Check PostgreSQL is running and credentials are correct
3. **Node modules**: Run `npm install` in both frontend and backend directories if needed

### Quick Fixes:
```bash
# Restart PostgreSQL (Windows)
net stop postgresql-x64-14
net start postgresql-x64-14

# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Clear npm cache if needed
npm cache clean --force
```

## Features to Explore

Once running, you can:
- 🗺️ Explore the interactive water quality map
- 📊 View analytics and trends
- ⚠️ Check water quality alerts
- 🎯 Filter by parameters (pH, turbidity, etc.)
- 📈 See AI predictions for water quality
- 📤 Export data in various formats

## Demo Data

The application includes realistic sample data for:
- 100+ monitoring locations across India
- Historical water quality measurements
- Risk assessments and alerts
- Government compliance data

Perfect for hackathon demos and presentations! 🎉