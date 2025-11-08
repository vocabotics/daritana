const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 7001;

// CORS
const corsOrigins = ['http://localhost:7000', 'http://localhost:5174', 'http://localhost:5173', 'http://127.0.0.1:5174'];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints
app.get('/api/settings', (req, res) => {
  res.json({
    language: 'en',
    timezone: 'Asia/Kuala_Lumpur',
    currency: 'MYR',
    dateFormat: 'dd/mm/yyyy',
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    taskAssignments: true,
    meetingReminders: true,
    twoFactorAuth: false,
    allowTeamInvitations: true,
    requireApproval: true,
    shareProjectVisibility: false
  });
});

// Notifications endpoint
app.get('/api/notifications/unread-count', (req, res) => {
  res.json({ unreadCount: 5 });
});

// Generic success for other endpoints
app.use('/api/*', (req, res) => {
  res.json({ success: true, message: 'Endpoint reached', path: req.path });
});

app.listen(PORT, () => {
  console.log('\n🚀 Temporary backend server running on http://localhost:' + PORT);
  console.log('✅ Health check: http://localhost:' + PORT + '/health');
  console.log('✅ Settings API: http://localhost:' + PORT + '/api/settings\n');
});
