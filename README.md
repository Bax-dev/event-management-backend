# Event Management Express API

A RESTful API for managing events, bookings, tickets, orders, and waiting lists. Built with Express.js and PostgreSQL.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Design Choices](#design-choices)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Environment Variables](#environment-variables)

## Prerequisites

- Node.js (v20.11.0 or higher)
- PostgreSQL (v12 or higher)
- yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Bax-dev/event-management-backend.git
cd event-management-express
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_management
DB_USER=your_username
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Body Parser Limits
JSON_BODY_LIMIT=10mb
URL_ENCODED_LIMIT=10mb
```

4. Run database migrations (the database will be created automatically if it doesn't exist):
```bash
yarn migrate
```

Note: The database will be automatically created when you start the application with `yarn start` or `yarn dev` if it doesn't already exist. You can also run migrations manually using the command above.

## Running the Application

### Development Mode
```bash
yarn dev
```
This starts the server with auto-reload on file changes.

### Production Mode
```bash
yarn start
```

### Check Migration Status
```bash
yarn migrate:status
```

### Rollback Migrations
```bash
yarn migrate:rollback
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Documentation

Once the server is running, you can access the interactive API documentation at:

### Production
- Swagger UI: `https://event-management-backend-ky30.onrender.com/api-docs`
- Swagger JSON: `https://event-management-backend-ky30.onrender.com/api-docs/swagger.json`

### Local Development
- Swagger UI: `http://localhost:3000/api-docs`
- Swagger JSON: `http://localhost:3000/api-docs/swagger.json`

### Postman Collection

You can import and test the API using the Postman collection:
- [Postman Collection](https://www.postman.com/universal-equinox-725698/maon-technology-limited)

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

#### Events
- `GET /api/events` - Get all events (with pagination)
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/:id/tickets` - Get available tickets for an event
- `PUT /api/events/:id` - Update an event (supports adding/removing tickets)
- `DELETE /api/events/:id` - Delete an event

#### Tickets
- `POST /api/tickets/initialize` - Initialize a new event with tickets
- `POST /api/tickets/book` - Book tickets (automatically adds to waiting list if sold out)
- `POST /api/tickets/cancel` - Cancel a booking
- `GET /api/tickets/status/:eventId` - Get event status and waiting list

#### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/:id` - Get booking by ID
- `GET /api/bookings/event/:eventId` - Get all bookings for an event
- `DELETE /api/bookings/:id` - Delete a booking

#### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order status
- `GET /api/orders/user/:userId` - Get orders for a user

#### Waiting List
- `GET /api/waiting-list/event/:eventId` - Get waiting list for an event
- `DELETE /api/waiting-list/:id` - Remove from waiting list

#### Audit Logs
- `GET /api/audit-logs` - Get audit logs (with filtering)
- `GET /api/audit-logs/entity/:entityType/:entityId` - Get logs for a specific entity
- `GET /api/audit-logs/action/:action` - Get logs for a specific action

## Design Choices

### Architecture Pattern

The application follows a **layered architecture** with clear separation of concerns:

1. **Routes Layer** (`src/routes/`): Defines API endpoints and applies middleware (rate limiting, authentication)
2. **Controllers Layer** (`src/controllers/`): Handles HTTP requests/responses, validates input, and delegates to services
3. **Services Layer** (`src/services/`): Contains business logic, orchestrates operations, and manages transactions
4. **Repository Layer** (`src/repositories/`): Abstracts database operations and provides data access methods
5. **Model Layer** (`src/model/`): Defines entities, request/response models, and validation logic

### Key Design Decisions

#### 1. Repository Pattern
- All database operations are abstracted through repository classes
- Provides a clean interface for data access
- Makes it easy to swap database implementations or add caching
- Each repository handles a single entity type

#### 2. Service Layer for Business Logic
- Business rules and complex operations are handled in services
- Services coordinate between multiple repositories
- Transaction management is handled at the service level
- Services use locking mechanisms to prevent race conditions

#### 3. Request/Response Models
- Separate models for request validation and response formatting
- Request models validate input data before processing
- Response models format data for API consumers
- Ensures consistent API contracts

#### 4. Transaction Management
- Critical operations use database transactions to ensure data consistency
- `TransactionUtil` provides a clean interface for transaction handling
- Transactions are used for operations that modify multiple tables (e.g., booking creation updates both bookings and events)

#### 5. Optimistic Locking
- Events use version-based optimistic locking to prevent concurrent modification conflicts
- ETag headers are used for conditional updates
- Prevents lost updates in concurrent scenarios

#### 6. Distributed Locking
- `LockUtil` provides distributed locking using in-memory locks
- Prevents race conditions when updating shared resources (e.g., event ticket counts)
- Ensures atomicity of operations across concurrent requests

#### 7. Caching Strategy
- In-memory caching for frequently accessed data (events, bookings)
- Cache invalidation on write operations
- Reduces database load for read-heavy operations

#### 8. Error Handling
- Custom error classes for different error types (ValidationError, NotFoundError, ConflictError, etc.)
- Centralized error handling middleware
- Consistent error response format across the API
- Proper HTTP status codes for different error scenarios

#### 9. Rate Limiting
- Different rate limits for read and write operations
- Prevents abuse and ensures fair resource usage
- Configurable limits per endpoint type

#### 10. Audit Logging
- All significant operations are logged to an audit log table
- Tracks who did what, when, and with what data
- Useful for debugging, compliance, and security

#### 11. Waiting List Management
- Automatic waiting list enrollment when events are sold out
- Priority-based waiting list (FIFO)
- Automatic fulfillment when tickets become available (e.g., on cancellation)

#### 12. Ticket Management
- Two API approaches:
  - Full CRUD via `/api/events` for comprehensive event management
  - Simplified endpoints via `/api/tickets` for quick operations
- Ticket addition/subtraction: PUT `/api/events/:id` with `totalTickets` adds to existing count (positive to add, negative to remove)
- Validation prevents reducing tickets below booked count

#### 13. Database Migrations
- Version-controlled database schema changes
- Migration runner tracks executed migrations
- Supports rollback capabilities

#### 14. API Documentation
- Swagger/OpenAPI documentation generated from JSDoc comments
- Interactive API explorer at `/api-docs`
- Auto-generated from route definitions

### Data Flow Example

For a ticket booking operation:

1. **Route** (`/api/tickets/book`) receives HTTP request
2. **Controller** validates authentication and request data
3. **Service** checks ticket availability, acquires lock, starts transaction
4. **Repository** queries/updates database within transaction
5. **Service** handles business logic (waiting list if sold out)
6. **Controller** formats response using response model
7. **Route** returns HTTP response

## Project Structure

```
src/
├── config/           # Configuration files (database, swagger)
├── constants/        # Application constants (statuses, actions)
├── controllers/      # Request handlers
├── middleware/       # Express middleware (auth, JSON parser)
├── model/           # Data models
│   ├── entity/      # Domain entities
│   ├── request/    # Request validation models
│   └── response/    # Response formatting models
├── repositories/    # Data access layer
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # Type definitions
└── utils/           # Utility functions
    ├── cache.util.js
    ├── error-handler.util.js
    ├── lock.util.js
    ├── transaction.util.js
    └── ...
```

## Testing

### Run All Tests
```bash
yarn test
```

### Run Unit Tests Only
```bash
yarn test:unit
```

### Run Integration Tests Only
```bash
yarn test:integration
```

### Run Tests with Coverage
```bash
yarn test:coverage
```

### Watch Mode
```bash
yarn test:watch
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | - |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `JSON_BODY_LIMIT` | Max JSON body size | `10mb` |
| `URL_ENCODED_LIMIT` | Max URL-encoded body size | `10mb` |

## Health Check

The API provides a health check endpoint:
```
GET /health
```

Returns the server status and database connection status.

## CI/CD Pipeline

The project includes a GitHub Actions workflow for continuous integration and deployment (`.github/workflows/ci.yml`):

### CI Jobs (runs on every push and pull request):
- **Lint**: Code quality checks with ESLint
- **Test**: Unit and integration tests with PostgreSQL service
- **Build**: Application build verification
- **Security**: Dependency security audit

### Deploy Job (runs only on pushes to main branch):
- Deploys to production after all CI jobs pass
- Uses environment variables from GitHub Secrets

### GitHub Secrets Required for Deployment

Add these secrets in GitHub (Settings > Secrets and variables > Actions):

- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_SSL` - Database SSL setting (true/false)
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time

**Note**: CI jobs (lint, test, build, security) run without secrets. Only the deploy job requires secrets.

See `.github/SETUP.md` for detailed setup instructions.

## License

MIT

