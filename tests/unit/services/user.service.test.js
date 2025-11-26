const { UserService } = require('../../../src/services/user.service');
const { UserRepository } = require('../../../src/repositories/user.repository');
const { TransactionUtil } = require('../../../src/utils/transaction.util');
const { IdGeneratorUtil } = require('../../../src/utils/id-generator.util');
const bcrypt = require('bcrypt');
const {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
} = require('../../../src/utils/custom-errors.util');

// Mock dependencies
const mockUserRepositoryInstance = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  updateLastLogin: jest.fn(),
};

jest.mock('../../../src/repositories/user.repository', () => {
  return {
    UserRepository: jest.fn(() => mockUserRepositoryInstance),
  };
});
jest.mock('../../../src/utils/transaction.util');
jest.mock('../../../src/utils/id-generator.util');
jest.mock('../../../src/utils/database.connection');
jest.mock('bcrypt');

describe('UserService', () => {
  let userService;
  let mockRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default TransactionUtil mock
    TransactionUtil.execute = jest.fn((callback) => {
      return callback(null); // Pass null as client for simplicity
    });
    
    // Mock IdGeneratorUtil
    jest.spyOn(IdGeneratorUtil, 'generateId').mockReturnValue('user_123');
    
    // Create service after mocks are set up
    userService = new UserService();
    
    // Always replace with our mock instance to ensure it's used
    userService.repository = mockUserRepositoryInstance;
    
    // Ensure we're using the mock instance
    mockRepository = mockUserRepositoryInstance;
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '12345678901',
    };

    it('should register a new user successfully', async () => {
      const mockUserId = 'user_123';
      const mockPasswordHash = 'hashed_password';
      const mockCreatedUser = {
        id: mockUserId,
        email: validUserData.email.toLowerCase(),
        name: validUserData.name,
        phone: validUserData.phone,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByEmail.mockResolvedValue(null);
      jest.spyOn(IdGeneratorUtil, 'generateId').mockReturnValue(mockUserId);
      bcrypt.hash.mockResolvedValue(mockPasswordHash);
      mockRepository.create.mockResolvedValue(mockCreatedUser);

      const result = await userService.register(validUserData);

      expect(mockRepository.findByEmail).toHaveBeenCalledWith(
        validUserData.email,
        null
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10);
      expect(IdGeneratorUtil.generateId).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });

    it('should throw ConflictError when email already exists', async () => {
      const existingUser = {
        id: 'user_456',
        email: validUserData.email,
      };

      mockRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(userService.register(validUserData)).rejects.toThrow(
        ConflictError
      );
      await expect(userService.register(validUserData)).rejects.toThrow(
        'Email already registered'
      );

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should convert email to lowercase', async () => {
      const mockUserId = 'user_123';
      const mockPasswordHash = 'hashed_password';
      const upperCaseEmail = 'TEST@EXAMPLE.COM';

      mockRepository.findByEmail.mockResolvedValue(null);
      jest.spyOn(IdGeneratorUtil, 'generateId').mockReturnValue(mockUserId);
      bcrypt.hash.mockResolvedValue(mockPasswordHash);
      mockRepository.create.mockResolvedValue({});

      await userService.register({
        ...validUserData,
        email: upperCaseEmail,
      });

      expect(mockRepository.findByEmail).toHaveBeenCalledWith(
        upperCaseEmail,
        null
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: upperCaseEmail.toLowerCase(),
        }),
        null
      );
    });

    it('should throw DatabaseError on repository error', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      IdGeneratorUtil.generateId.mockReturnValue('user_123');
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockRepository.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(userService.register(validUserData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        passwordHash: 'hashed_password',
        isActive: true,
        name: 'Test User',
      };

      mockRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      mockRepository.updateLastLogin.mockResolvedValue(undefined);

      const result = await userService.login(loginData.email, loginData.password);

      expect(mockRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.passwordHash
      );
      expect(mockRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedError when user does not exist', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      await expect(
        userService.login(loginData.email, loginData.password)
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        userService.login(loginData.email, loginData.password)
      ).rejects.toThrow('Invalid email or password');

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when account is deactivated', async () => {
      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        passwordHash: 'hashed_password',
        isActive: false,
      };

      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        userService.login(loginData.email, loginData.password)
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        userService.login(loginData.email, loginData.password)
      ).rejects.toThrow('Account is deactivated');

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when password is incorrect', async () => {
      const mockUser = {
        id: 'user_123',
        email: loginData.email,
        passwordHash: 'hashed_password',
        isActive: true,
      };

      mockRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        userService.login(loginData.email, loginData.password)
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        userService.login(loginData.email, loginData.password)
      ).rejects.toThrow('Invalid email or password');

      expect(mockRepository.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError on repository error', async () => {
      mockRepository.findByEmail.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        userService.login(loginData.email, loginData.password)
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user_123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
      };

      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = 'non_existent';

      mockRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow(NotFoundError);
      await expect(userService.getUserById(userId)).rejects.toThrow(
        `User with id ${userId} not found`
      );
    });

    it('should throw DatabaseError on repository error', async () => {
      const userId = 'user_123';

      mockRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(userService.getUserById(userId)).rejects.toThrow(DatabaseError);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user_123',
        email,
        name: 'Test User',
        isActive: true,
      };

      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail(email);

      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const email = 'nonexistent@example.com';

      mockRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.getUserByEmail(email)).rejects.toThrow(NotFoundError);
      await expect(userService.getUserByEmail(email)).rejects.toThrow(
        `User with id ${email} not found`
      );
    });

    it('should throw DatabaseError on repository error', async () => {
      const email = 'test@example.com';

      mockRepository.findByEmail.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(userService.getUserByEmail(email)).rejects.toThrow(DatabaseError);
    });
  });
});

