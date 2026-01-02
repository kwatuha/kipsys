const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import route groups
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const queueRoutes = require('./routes/queueRoutes');
const billingRoutes = require('./routes/billingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const laboratoryRoutes = require('./routes/laboratoryRoutes');
const radiologyRoutes = require('./routes/radiologyRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const patientAllergiesRoutes = require('./routes/patientAllergiesRoutes');
const clinicalServicesRoutes = require('./routes/clinicalServicesRoutes');
const doctorsRoutes = require('./routes/doctorsRoutes');
const inpatientRoutes = require('./routes/inpatientRoutes');
const maternityRoutes = require('./routes/maternityRoutes');
const icuRoutes = require('./routes/icuRoutes');
const triageRoutes = require('./routes/triageRoutes');
const medicalRecordsRoutes = require('./routes/medicalRecordsRoutes');

const authenticate = require('./middleware/authenticate');

const port = process.env.PORT || 3001;
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to Kiplombe Medical Centre HMIS API',
        version: '1.0.0',
        status: 'running'
    });
});

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Development: Temporarily disable auth for data fetching routes
// TODO: Re-enable authentication in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', authenticate);
} else {
  // In development, only protect sensitive routes
  app.use('/api/users', authenticate);
}

// API routes
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/laboratory', laboratoryRoutes);
app.use('/api/radiology', radiologyRoutes);
app.use('/api/inpatient', inpatientRoutes);
app.use('/api/maternity', maternityRoutes);
app.use('/api/icu', icuRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/patients', patientAllergiesRoutes);
app.use('/api/clinical-services', clinicalServicesRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
    console.log(`Kiplombe Medical Centre API server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

