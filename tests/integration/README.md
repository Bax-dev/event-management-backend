# Integration Tests

Integration tests for the Event Management API endpoints.

## Prerequisites

Integration tests require a test database to be configured. You need to:

1. **Set up a test database** (PostgreSQL)
2. **Configure environment variables** in `.env.test`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_management_test
DB_USER=your_test_user
DB_PASSWORD=your_test_password

# JWT Configuration
JWT_SECRET=test-secret-key

# Other environment variables as needed
NODE_ENV=test
```

3. **Run database migrations** on the test database:
```bash
# Set environment to use test database
export DB_NAME=event_management_test
npm run migrate
```

## Running Integration Tests

```bash
# Run all integration tests
yarn test:integration

# Run specific integration test file
yarn test tests/integration/auth.integration.test.js
```

## Test Structure

- `helpers/test-app.js` - Creates a test Express app instance
- `helpers/test-helpers.js` - Utility functions for creating test data
- `setup.js` - Test environment setup
- `*.integration.test.js` - Individual test suites for each API endpoint group

## Test Coverage

Integration tests cover:

- **Auth API** (`auth.integration.test.js`):
  - User registration
  - User login
  - User profile retrieval
  - Authentication and authorization

- **Events API** (`events.integration.test.js`):
  - Event creation
  - Event retrieval (single and list)
  - Event updates
  - Event deletion
  - Available tickets query

- **Bookings API** (`bookings.integration.test.js`):
  - Booking creation
  - Booking retrieval
  - Booking cancellation
  - Event booking queries

- **Orders API** (`orders.integration.test.js`):
  - Order creation
  - Order retrieval by user
  - Order validation

## Notes

- Integration tests use a real database connection
- Test data should be cleaned up after each test (implemented in `TestHelpers.cleanup()`)
- Tests may take longer to run than unit tests due to database operations
- Ensure your test database is separate from your development/production database

