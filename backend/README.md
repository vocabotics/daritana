# Daritana Backend API

Backend API server for the Daritana Architecture Management System.

## Features

- RESTful API with Express and TypeScript
- PostgreSQL database with Prisma ORM
- Real-time collaboration with Socket.io
- WebRTC signaling for audio/video calls
- JWT authentication
- File upload and version control
- Document review and annotation system

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Update database connection string
- Set JWT secret key

3. Setup database:
```bash
# Windows
./setup-dev.bat

# Linux/Mac
npm run prisma:migrate
npm run prisma:generate
```

4. Start development server:
```bash
npm run dev
```

The server will start on http://localhost:8080

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get single document
- `POST /api/documents` - Upload new document
- `PATCH /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/versions` - Create new version

### Reviews
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/:id` - Get single review
- `POST /api/reviews` - Create review
- `PATCH /api/reviews/:id` - Update review
- `POST /api/reviews/:id/start` - Start review session
- `POST /api/reviews/:id/end` - End review session
- `POST /api/reviews/:id/participants` - Add participant
- `POST /api/reviews/:id/decisions` - Record decision

## WebSocket Events

### Connection
- `connection` - Client connected
- `disconnect` - Client disconnected

### Document Review
- `join-review` - Join review room
- `leave-review` - Leave review room
- `send-message` - Send chat message
- `add-annotation` - Add document annotation
- `cursor-move` - Share cursor position
- `selection-change` - Share text selection

### WebRTC Signaling
- `webrtc-join-room` - Join WebRTC room
- `webrtc-offer` - Send WebRTC offer
- `webrtc-answer` - Send WebRTC answer
- `webrtc-ice-candidate` - Exchange ICE candidates
- `webrtc-media-state` - Update media state

## Development

### Database Management
```bash
# Create migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run seed
```

### Testing
```bash
npm test
```

### Build for Production
```bash
npm run build
npm start
```

## Architecture

```
backend/
├── src/
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── sockets/        # Socket.io handlers
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.ts       # Main server file
├── prisma/
│   └── schema.prisma   # Database schema
├── uploads/            # File uploads directory
└── package.json
```

## Security

- JWT tokens for authentication
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers
- Input validation with Zod
- SQL injection protection with Prisma

## License

MIT