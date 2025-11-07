# 🏗️ Daritana - Revolutionary Architecture & Interior Design Platform

<div align="center">
  <img src="public/logo.png" alt="Daritana Logo" width="200"/>
  
  [![CI/CD Pipeline](https://github.com/yourusername/daritana/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/daritana/actions/workflows/ci.yml)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
</div>

## 🚀 Overview

Daritana is a comprehensive, AI-powered platform designed specifically for Malaysian architects and interior designers. It combines advanced project management, regulatory compliance automation, intelligent design tools, and a vibrant professional community into one revolutionary ecosystem.

### ✨ Key Features

- **🤖 AI-Powered Virtual Project Manager** - Natural language project management via WhatsApp, Telegram, and Email
- **📋 Malaysian Regulatory Compliance** - Automated UBBL compliance checking and DBKL submission integration
- **🎨 Generative Design Tools** - AI-powered mood board generation and architectural drawing automation
- **💰 Integrated Payment Gateway** - FPX, e-wallets, and multi-currency support
- **👥 Professional Community** - Marketplace, bidding system, and networking platform
- **📱 Progressive Web App** - Mobile-first design with offline capabilities
- **🌍 Multi-Language Support** - English, Bahasa Malaysia, Chinese, and Tamil

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Radix UI** for accessible components

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database
- **Redis** for caching
- **Socket.IO** for real-time features
- **Sequelize** ORM

### Infrastructure
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **AWS/GCP** for cloud hosting
- **MinIO** for S3-compatible storage

## 📦 Prerequisites

- Node.js 20+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/daritana.git
cd daritana
```

2. **Copy environment variables**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. **Start all services with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the applications**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/v1
- pgAdmin: http://localhost:5050 (admin@daritana.com / admin123)
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)

### Manual Setup

1. **Install frontend dependencies**
```bash
npm install
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Set up PostgreSQL database**
```bash
createdb daritana_dev
```

4. **Run database migrations**
```bash
cd backend
npm run db:migrate
npm run db:seed # Optional: seed with sample data
```

5. **Start Redis server**
```bash
redis-server
```

6. **Start the backend server**
```bash
cd backend
npm run dev
```

7. **Start the frontend development server**
```bash
npm run dev
```

## 🧪 Testing

### Run all tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test

# E2E tests
npm run test:e2e
```

### Run with coverage
```bash
npm test -- --coverage
```

## 📝 Development

### Project Structure
```
daritana/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── store/             # Zustand stores
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── backend/               # Backend source code
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── tests/             # Backend tests
├── public/                # Static assets
├── .github/               # GitHub Actions workflows
└── docker-compose.yml     # Docker configuration
```

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## 🚢 Deployment

### Using Docker

1. **Build production images**
```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Deploy to server**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **Build frontend**
```bash
npm run build
```

2. **Build backend**
```bash
cd backend
npm run build
```

3. **Set production environment variables**
```bash
export NODE_ENV=production
# Set other required environment variables
```

4. **Start the application**
```bash
cd backend
npm start
```

## 📊 Monitoring

- **Health Check**: http://localhost:5000/health
- **Metrics**: Integrated with Sentry and LogRocket
- **Logs**: Available in `backend/logs/` directory

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 Documentation

- [API Documentation](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)

## 🔒 Security

- All data is encrypted in transit and at rest
- JWT-based authentication with refresh tokens
- Rate limiting and DDoS protection
- Regular security audits and dependency updates

## 📈 Roadmap

See our [Implementation Master Plan](IMPLEMENTATION_MASTER_PLAN.md) for detailed development roadmap.

### Phase 1 (Months 1-3) ✅
- Core infrastructure setup
- Basic project management features
- User authentication and authorization

### Phase 2 (Months 4-6) 🚧
- Malaysian compliance integration
- Design brief system
- Document management

### Phase 3 (Months 7-9) 📅
- AI integration
- Advanced project management
- Mobile PWA

### Phase 4 (Months 10-12) 📅
- Payment gateway integration
- Marketplace development
- Community features

## 📞 Support

- **Email**: support@daritana.com
- **Documentation**: https://docs.daritana.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/daritana/issues)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Malaysian architecture and interior design community
- Open source contributors
- Technology partners and advisors

---

<div align="center">
  Made with ❤️ in Malaysia 🇲🇾
  
  **Daritana** - Transforming How Malaysian Architects and Designers Work
</div>