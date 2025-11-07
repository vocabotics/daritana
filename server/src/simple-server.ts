import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Mock users database
const users = [
  {
    id: '1',
    email: 'admin@daritana.com',
    password: '$2a$10$YourHashedPasswordHere', // Will be set on first login attempt
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'lead@daritana.com',
    password: '$2a$10$YourHashedPasswordHere',
    username: 'lead',
    firstName: 'Project',
    lastName: 'Lead',
    role: 'project_lead'
  },
  {
    id: '3',
    email: 'designer@daritana.com',
    password: '$2a$10$YourHashedPasswordHere',
    username: 'designer',
    firstName: 'Creative',
    lastName: 'Designer',
    role: 'designer'
  },
  {
    id: '4',
    email: 'client@example.com',
    password: '$2a$10$YourHashedPasswordHere',
    username: 'client',
    firstName: 'John',
    lastName: 'Client',
    role: 'client'
  },
  {
    id: '5',
    email: 'contractor@build.com',
    password: '$2a$10$YourHashedPasswordHere',
    username: 'contractor',
    firstName: 'Mike',
    lastName: 'Contractor',
    role: 'contractor'
  },
  {
    id: '6',
    email: 'staff@daritana.com',
    password: '$2a$10$YourHashedPasswordHere',
    username: 'staff',
    firstName: 'Emma',
    lastName: 'Staff',
    role: 'staff'
  }
];

// Login endpoint
app.post('/api/auth/login', async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password: password ? '***' : 'empty' });
    
    // Find user
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // For demo purposes, accept 'password123' as the password
    if (password !== 'password123') {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    // Return user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res): Promise<any> => {
  try {
    const { email, password, username, firstName, lastName, role } = req.body;
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: String(users.length + 1),
      email,
      password: hashedPassword,
      username,
      firstName,
      lastName,
      role: role || 'client'
    };
    
    users.push(newUser);
    
    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
app.get('/api/auth/me', (req, res): any => {
  // Extract token from header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Test accounts (all use password: password123):`);
  console.log(`   - admin@daritana.com (Admin)`);
  console.log(`   - lead@daritana.com (Project Lead)`);
  console.log(`   - designer@daritana.com (Designer)`);
  console.log(`   - client@example.com (Client)`);
  console.log(`   - contractor@build.com (Contractor)`);
  console.log(`   - staff@daritana.com (Staff)`);
});