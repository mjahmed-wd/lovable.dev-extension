# Lovable Extension API

A Node.js Express TypeScript API with MongoDB for the Lovable Extension. Features user authentication, CRUD operations for tasks and tests, and comprehensive API documentation.

## Features

- 🔐 JWT-based authentication
- 📝 CRUD operations for tasks and tests
- 📚 Swagger API documentation
- 🛡️ Input validation and sanitization
- ⚡ Rate limiting
- 🔒 Security middleware (helmet, cors)
- 📦 MongoDB with Mongoose ODM
- 🧪 TypeScript for type safety

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Environment Setup

Copy the environment example file and update the values:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/lovable-extension
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 3. Start MongoDB

Make sure MongoDB is running on your system. You can start it with:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Linux
sudo systemctl start mongod

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### 5. Access API Documentation

Open your browser and navigate to:
- **API Documentation**: `http://localhost:3001/api-docs`
- **Health Check**: `http://localhost:3001/health`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Tasks
- `GET /api/tasks` - Get all tasks (with pagination and filters)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Tests
- `GET /api/tests` - Get all tests (with pagination and filters)
- `POST /api/tests` - Create a new test
- `GET /api/tests/:id` - Get a specific test
- `PUT /api/tests/:id` - Update a test
- `DELETE /api/tests/:id` - Delete a test
- `POST /api/tests/:id/run` - Run a specific test

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Registration

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Example Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Data Models

### User
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `isActive`: Boolean (default: true)

### Task
- `title`: String (required)
- `description`: String (optional)
- `status`: Enum ['todo', 'in_progress', 'completed', 'cancelled']
- `priority`: Enum ['low', 'medium', 'high']
- `dueDate`: Date (optional)
- `tags`: Array of strings
- `userId`: ObjectId (required)

### Test
- `name`: String (required)
- `description`: String (optional)
- `type`: Enum ['unit', 'integration', 'e2e', 'manual']
- `status`: Enum ['pending', 'running', 'passed', 'failed', 'skipped']
- `duration`: Number (optional, in milliseconds)
- `errorMessage`: String (optional)
- `testData`: Mixed (optional)
- `tags`: Array of strings
- `userId`: ObjectId (required)
- `taskId`: ObjectId (optional, reference to Task)

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Validation errors when applicable
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- MongoDB injection protection

## Development

### Project Structure

```
api/
├── src/
│   ├── config/
│   │   └── database.ts      # MongoDB connection
│   ├── middleware/
│   │   ├── auth.ts         # JWT authentication
│   │   └── errorHandler.ts # Error handling
│   ├── models/
│   │   ├── User.ts         # User model
│   │   ├── Task.ts         # Task model
│   │   └── Test.ts         # Test model
│   ├── routes/
│   │   ├── auth.ts         # Authentication routes
│   │   ├── tasks.ts        # Task CRUD routes
│   │   └── tests.ts        # Test CRUD routes
│   └── server.ts           # Main server file
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License 