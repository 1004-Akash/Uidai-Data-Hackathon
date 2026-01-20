# Adhaar Enrollment & Demographic Analytics

This is a full-stack application for visualizing enrollment, demographic, and biometric data.

## Project Structure
- `backend/`: Python FastAPI backend.
  - `data/`: CSV data storage (chunks of enrollment data).
- `frontend/`: React/Next.js frontend.

## Prerequisites
- Python 3.8+
- Node.js 18+
- npm

## Setup & Running

### Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   python main.py
   ```
   The backend will start at `http://localhost:8000`.

### Frontend
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

## API Documentation
The main API endpoint is:
`GET /resource/ecd49b12-3084-4521-8f7e-ca8bf72069ba`

**Parameters:**
- `api-key`: `generated-api-key`
- `format`: `json`, `csv`, or `xml` (default: `json`)
- `offset`: Pagination offset (default: `0`)
- `limit`: Pagination limit (default: `10`)
- `filters[state]`: Filter by state
- `filters[district]`: Filter by district

## Features
- **Dynamic Filters**: State and District dropdowns populated from data.
- **Visualizations**: Line charts for age-group trends.
- **Data Table**: Tabular view of combined enrollment, demographic, and biometric data.
- **Multi-format API**: Support for JSON, CSV, and XML response formats.
- **Caching**: Server-side data caching for performance.
