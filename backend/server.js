const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  // Render backend (for self-pings and Render health checks)
  'https://trao-ai-intelligent-travel-planner.onrender.com',
  /https:\/\/.*\.onrender\.com$/,
  // Vercel frontend domains
  'https://trao-travel-planner.vercel.app',
  /https:\/\/trao.*\.vercel\.app$/,
  /https:\/\/.*\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Render health checks)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) return callback(null, true);
    // In development (no NODE_ENV set), allow all
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') return callback(null, true);
    callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Bind Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root — API Info (shown when visiting the backend URL directly)
app.get('/', (req, res) => {
  res.status(200).json({
    name: '🌍 Trao AI Travel Planner — API Gateway',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date(),
    endpoints: {
      health:       'GET  /health',
      register:     'POST /api/auth/register',
      login:        'POST /api/auth/login',
      trips:        'GET  /api/trips',
      createTrip:   'POST /api/trips',
      getTrip:      'GET  /api/trips/:id',
      updateTrip:   'PUT  /api/trips/:id',
      deleteTrip:   'DELETE /api/trips/:id',
      regenerateDay:'POST /api/trips/:id/regenerate-day',
      apiHealth:    'GET  /api/admin/health',
    }
  });
});

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Graceful Error Handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway active on port ${PORT}`);
});
