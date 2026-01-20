# Aqua-AI Setup Guide

This guide will walk you through setting up the Aqua-AI water quality monitoring platform from scratch.

## 🚀 Quick Start (Recommended for Hackathons)

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- Git
- Docker (optional but recommended)

### Option 1: Docker Setup (Easiest)

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd aqua-ai-project
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys (optional for demo)
   ```

3. **Run with Docker Compose**

   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

### Option 2: Manual Setup

#### Backend Setup

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Set up environment**

   ```bash
   cp ../.env.example .env
   # Configure your database and API keys
   ```

3. **Start the backend server**
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

#### Database Setup

1. **Install PostgreSQL with PostGIS**

   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib postgis

   # macOS
   brew install postgresql postgis

   # Windows
   Download from https://www.postgresql.org/download/
   ```

2. **Create database**

   ```bash
   sudo -u postgres psql
   CREATE DATABASE aqua_ai_db;
   CREATE USER aqua_ai WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE aqua_ai_db TO aqua_ai;
   \q
   ```

3. **Initialize schema**
   ```bash
   psql -U aqua_ai -d aqua_ai_db -f database/schema.sql
   ```

#### AI Models and Data Pipeline

1. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run data pipeline**

   ```bash
   cd data-pipeline
   python fetch_data.py
   ```

3. **Train AI models**
   ```bash
   cd ai-models
   python train_model.py
   ```

## 🛠️ Development Workflow

### Running the Full Stack

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Data Pipeline (optional)
cd data-pipeline && python fetch_data.py
```

### API Testing

The backend provides these key endpoints:

- `GET /api/health` - Health check
- `GET /api/locations` - Water monitoring locations
- `GET /api/water-quality/:locationId` - Quality data for location
- `GET /api/predictions/:locationId` - AI predictions
- `GET /api/alerts` - Active alerts

### Database Management

```bash
# Connect to database
psql -U aqua_ai -d aqua_ai_db

# View locations
SELECT * FROM locations LIMIT 10;

# View recent readings
SELECT * FROM water_quality_readings ORDER BY measurement_date DESC LIMIT 10;

# Check AI predictions
SELECT * FROM ai_predictions WHERE risk_level = 'high';
```

## 🎯 For Hackathons

### Demo Data

The application includes sample data generators for demo purposes:

- **Frontend**: Uses sample locations with realistic water quality data
- **AI Models**: Generates synthetic training data if real data isn't available
- **Data Pipeline**: Includes mock data sources for testing

### Key Features to Highlight

1. **Interactive Map**: Real-time visualization of water quality across India
2. **AI Predictions**: Machine learning models predicting pollution events
3. **Risk Assessment**: Color-coded risk levels and alerts
4. **Government Data**: Integration with official Indian government APIs
5. **Open Source**: Fully accessible codebase and documentation

### Presentation Tips

- Start with the interactive map to show visual impact
- Demonstrate filtering by parameters and risk levels
- Show the prediction capabilities with sample data
- Highlight the real-world applicability and government data sources
- Emphasize the public service aspect and accessibility

## 📦 Deployment Options

### Option 1: Render (Recommended)

This project is configured for easy deployment on Render using the `render.yaml` blueprint.

1. Connect your GitHub repository to Render.
2. Select "Blueprints" and choose your repository.
3. Render will automatically detect `render.yaml` and configure the Frontend and Backend services.

### Option 2: AWS/GCP

- Use AWS RDS for PostgreSQL
- Deploy backend on AWS Lambda or EC2
- Host frontend on AWS S3 + CloudFront
- Use AWS SageMaker for AI model training

### Option 3: Self-hosted

```bash
# Build for production
npm run build

# Use nginx for reverse proxy
# Configure PM2 for process management
```

## 🔧 Configuration

### Environment Variables

Key variables to configure:

- `DATA_GOV_IN_API_KEY`: API key for data.gov.in
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to 'production' for deployment
- `FRONTEND_URL`: Your frontend domain

### API Keys Required

1. **data.gov.in**: For government water quality data
2. **CPCB**: For pollution control board data (if available)
3. **Weather API**: For environmental correlation (optional)

### Database Configuration

- Ensure PostGIS extension is enabled
- Configure connection pooling for production
- Set up automated backups
- Index optimization for large datasets

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**

   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql

   # Check PostGIS installation
   sudo -u postgres psql -c "SELECT PostGIS_version();"
   ```

2. **Frontend Build Errors**

   ```bash
   # Clear cache
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Python Dependencies**

   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Map Not Loading**
   - Check if Leaflet CSS is imported
   - Verify internet connection for map tiles
   - Check browser console for JavaScript errors

### Performance Optimization

- Use Redis for caching API responses
- Implement database connection pooling
- Optimize PostgreSQL queries with proper indexes
- Use CDN for static assets
- Implement lazy loading for map markers

## 📊 Monitoring and Analytics

### Health Checks

- API endpoint monitoring: `/api/health`
- Database connectivity checks
- Data pipeline status monitoring
- Model prediction accuracy tracking

### Logging

- Application logs: Winston (Node.js) + Python logging
- Error tracking: Sentry (recommended)
- Performance monitoring: New Relic or DataDog
- Database query logging for optimization

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards

- JavaScript/TypeScript: ESLint + Prettier
- Python: Black + Flake8
- Database: Follow PostgreSQL naming conventions
- Documentation: Update README for new features

## 📞 Support

For hackathon support or technical questions:

- Check the troubleshooting section above
- Review GitHub issues
- Test with sample data first
- Verify environment variables are set correctly

## 🎉 Success Metrics

### For Hackathons

- Fully functional interactive map ✓
- Real-time data visualization ✓
- AI prediction demonstration ✓
- Government data integration ✓
- Professional presentation ready ✓

### For Production

- Sub-second API response times
- 99.9% uptime
- Accurate predictions (>80% confidence)
- User engagement metrics
- Data freshness (daily updates)

Good luck with your hackathon! 🚀
