# Aqua-AI: Public Data Edition

## Overview
A web platform that serves as a public dashboard for India's water health, leveraging publicly available government data to provide real-time insights and AI-powered predictions about water quality.

## Key Features
- Interactive map of India showing water quality data
- Real-time and historical water quality monitoring
- AI-powered predictive modeling for pollution events
- Alert system for critical water quality issues
- Public dashboard for citizens, researchers, and authorities

## Data Sources

### Government APIs and Datasets
1. **Ministry of Jal Shakti**
   - National Water Quality Database
   - River Water Quality Monitoring
   - API: https://jal.gov.in/

2. **Central Pollution Control Board (CPCB)**
   - Water Quality Monitoring Network
   - Industrial Pollution Data
   - API: https://cpcb.nic.in/

3. **Data.gov.in**
   - Open Government Data Platform
   - Various water quality datasets
   - API: https://data.gov.in/

4. **National Institute of Hydrology**
   - Groundwater Quality Data
   - Surface Water Monitoring

### Key Water Quality Parameters
- **BOD (Biochemical Oxygen Demand)**: Organic pollution indicator
- **TDS (Total Dissolved Solids)**: General water purity measure
- **Heavy Metals**: Lead, Mercury, Cadmium, Arsenic
- **pH Level**: Acidity/Alkalinity
- **Dissolved Oxygen**: Aquatic life health indicator
- **Coliform Count**: Bacterial contamination
- **Nitrates/Phosphates**: Agricultural runoff indicators

## Technology Stack
- **Frontend**: React with TypeScript, Leaflet/Mapbox for maps
- **Backend**: Node.js with Express, Python for AI models
- **Database**: PostgreSQL with PostGIS for spatial data
- **AI/ML**: Python (scikit-learn, TensorFlow), pandas for data processing
- **APIs**: RESTful APIs for data integration
- **Deployment**: Docker containers, cloud hosting

## Project Structure
```
aqua-ai-project/
├── frontend/          # React application
├── backend/           # Node.js API server
├── ai-models/         # Python ML models
├── data-pipeline/     # Data fetching and processing
├── database/          # Schema and migrations
└── docs/              # Documentation
```

## 🚀 Getting Started

### Quick Setup (Recommended)
```bash
# Clone the project
git clone https://github.com/Kuldeep2822k/aqua-ai.git
cd aqua-ai

# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
pip install -r requirements.txt

# Run with sample data
npm run dev  # Starts both frontend and backend
```

### Detailed Setup
See [SETUP.md](SETUP.md) for comprehensive installation and deployment instructions.

## 🎯 Live Demo

**Key Features Demonstrated:**

1. **Interactive Map** 🗺️
   - Pan and zoom across India
   - Click markers for detailed water quality data
   - Filter by parameters (BOD, TDS, pH, etc.) and risk levels
   - Color-coded risk assessment (Green=Safe, Yellow=Medium, Red=High, Purple=Critical)

2. **Real-time Data Visualization** 📊
   - Current water quality index (WQI) scores
   - Parameter-specific measurements with safety thresholds
   - Historical trends and patterns
   - Government data source attribution

3. **AI-Powered Predictions** 🤖
   - Machine learning models trained on historical data
   - Pollution event forecasting
   - Confidence scores and risk assessments
   - Hotspot identification for emerging issues

4. **Alert System** ⚠️
   - Automated threshold violation detection
   - Risk level escalation notifications
   - Public health advisory generation
   - Email/SMS alert capabilities

## 🏗️ Architecture

```
Aqua-AI Platform
├── 🌐 Frontend (React + TypeScript)
│   ├── Interactive Map (Leaflet)
│   ├── Data Visualization (Charts)
│   ├── Real-time Updates
│   └── Responsive Design
│
├── 🔧 Backend (Node.js + Express)
│   ├── RESTful API endpoints
│   ├── Authentication & Security
│   ├── Data validation
│   └── Real-time notifications
│
├── 🗄️ Database (PostgreSQL + PostGIS)
│   ├── Spatial data storage
│   ├── Time-series optimization
│   ├── Data aggregation views
│   └── Automated indexing
│
├── 🤖 AI/ML Pipeline (Python)
│   ├── Data preprocessing
│   ├── Feature engineering
│   ├── Model training (Random Forest, Neural Networks)
│   ├── Prediction generation
│   └── Model performance monitoring
│
└── 📦 Data Pipeline (Python)
    ├── Government API integration
    ├── Data cleaning & validation
    ├── Automated scheduling
    └── Error handling & logging
```

## Hackathon Impact
This project addresses one of India's most critical environmental challenges while showcasing:
- Real-world problem solving
- AI/ML integration
- Open data utilization
- Interactive visualization
- Public service orientation
