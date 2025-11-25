const bcrypt = require('bcrypt');
const { User } = require('../model/entity/user.entity');
const { UserRepository } = require('../repositories/user.repository');
const { IdGeneratorUtil } = require('../utils/id-generator.util');
const { TransactionUtil } = require('../utils/transaction.util');
const {
  NotFoundError,
  ConflictError,
  DatabaseError,
  UnauthorizedError,
} = require('../utils/custom-errors.util');

class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  async register(data) {
    try {
      return await TransactionUtil.execute(async (client) => {
        const existingUser = await this.repository.findByEmail(data.email, client);

        if (existingUser) {
          throw new ConflictError('Email already registered');
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(data.password, saltRounds);

        const user = new User({
          id: IdGeneratorUtil.generateId(),
          email: data.email.toLowerCase(),
          passwordHash,
          name: data.name,
          phone: data.phone,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return this.repository.create(user, client);
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('Failed to register user', error);
    }
  }

  async login(email, password) {
    try {
      const user = await this.repository.findByEmail(email);

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      await this.repository.updateLastLogin(user.id);

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new DatabaseError('Failed to login', error);
    }
  }

  async getUserById(id) {
    try {
      const user = await this.repository.findById(id);

      if (!user) {
        throw new NotFoundError('User', id);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch user', error);
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await this.repository.findByEmail(email);

      if (!user) {
        throw new NotFoundError('User', email);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch user', error);
    }
  }
}

module.exports = { UserService };

