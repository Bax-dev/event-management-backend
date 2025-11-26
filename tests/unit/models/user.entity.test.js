const { User } = require('../../../src/model/entity/user.entity');

describe('User Entity', () => {
  describe('constructor', () => {
    it('should create a user with all fields', () => {
      const data = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        name: 'Test User',
        phone: '12345678901',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        lastLogin: new Date('2024-01-03'),
      };

      const user = new User(data);

      expect(user.id).toBe(data.id);
      expect(user.email).toBe(data.email);
      expect(user.passwordHash).toBe(data.passwordHash);
      expect(user.name).toBe(data.name);
      expect(user.phone).toBe(data.phone);
      expect(user.isActive).toBe(data.isActive);
      expect(user.createdAt).toEqual(data.createdAt);
      expect(user.updatedAt).toEqual(data.updatedAt);
      expect(user.lastLogin).toEqual(data.lastLogin);
    });

    it('should create a user with default values', () => {
      const user = new User({});

      expect(user.id).toBe('');
      expect(user.email).toBe('');
      expect(user.passwordHash).toBe('');
      expect(user.name).toBeUndefined();
      expect(user.phone).toBeUndefined();
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.lastLogin).toBeUndefined();
    });

    it('should set isActive to true by default', () => {
      const user = new User({ email: 'test@example.com' });

      expect(user.isActive).toBe(true);
    });

    it('should set isActive to false when explicitly set', () => {
      const user = new User({ email: 'test@example.com', isActive: false });

      expect(user.isActive).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation without passwordHash', () => {
      const data = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        name: 'Test User',
        phone: '12345678901',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        lastLogin: new Date('2024-01-03'),
      };

      const user = new User(data);
      const json = user.toJSON();

      expect(json).not.toHaveProperty('passwordHash');
      expect(json.id).toBe(data.id);
      expect(json.email).toBe(data.email);
      expect(json.name).toBe(data.name);
      expect(json.phone).toBe(data.phone);
      expect(json.isActive).toBe(data.isActive);
      expect(json.createdAt).toEqual(data.createdAt);
      expect(json.updatedAt).toEqual(data.updatedAt);
      expect(json.lastLogin).toEqual(data.lastLogin);
    });
  });
});

