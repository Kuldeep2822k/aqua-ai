# 🔧 Quick Setup Instructions

## ⚡ Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ (or use Docker)
- Docker & Docker Compose (optional but recommended)

## 🚀 Quick Start (3 Steps)

### 1️⃣ Clone and Install

```bash
git clone https://github.com/Kuldeep2822k/aqua-ai.git
cd aqua-ai

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install Python dependencies
pip install -r requirements.txt
pip install -r data-pipeline/requirements.txt
```

### 2️⃣ Configure Environment

```bash
# Copy environment template
cp .env.development .env

# Edit .env and add your API keys (optional for development)
# The app will work with default values for local development
```

### 3️⃣ Run the Application

**Option A: Using Docker (Recommended)**

```bash
docker-compose up -d
```

✅ Frontend: http://localhost:3000  
✅ Backend API: http://localhost:5000  
✅ Database: localhost:5432

**Option B: Manual Setup**

```bash
# Terminal 1: Start PostgreSQL (if not using Docker)
# Make sure PostgreSQL is running on port 5432

# Terminal 2: Run database migrations
npm run db:migrate

# Terminal 3: Start backend
cd backend && npm run dev

# Terminal 4: Start frontend
cd frontend && npm start
```

## 🔍 Verify Installation

1. **Check Backend Health**

   ```bash
   curl http://localhost:5000/api/health
   ```

   Should return: `{"status":"OK","message":"Aqua-AI API is running"}`

2. **Check Frontend**
   Open http://localhost:3000 in your browser

3. **Check Database**
   ```bash
   docker exec -it aqua-ai-db psql -U postgres -d aqua_ai_db -c "\dt"
   ```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change ports in .env file
PORT=5001  # for backend
# Frontend port can be changed in package.json
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep aqua-ai-db

# Restart database
docker-compose restart database
```

### Python Dependencies Error

```bash
# Upgrade pip first
pip install --upgrade pip

# Install dependencies again
pip install -r requirements.txt
```

## 📚 Next Steps

- Read [SETUP.md](SETUP.md) for detailed setup instructions
- Check [README.md](README.md) for project overview
- See [error_analysis.md](C:\Users\kulde.gemini\antigravity\brain\519ecb85-7051-4a72-9a53-9b0cb6a5df90\error_analysis.md) for resolved issues

## 🎯 Development Workflow

```bash
# Run all services
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Run data pipeline
npm run data:fetch

# Train AI models
npm run ai:train
```

---

**Need Help?** Check the [GitHub Issues](https://github.com/Kuldeep2822k/aqua-ai/issues) or documentation.
