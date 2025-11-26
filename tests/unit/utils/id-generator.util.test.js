const { IdGeneratorUtil } = require('../../../src/utils/id-generator.util');

describe('IdGeneratorUtil', () => {
  describe('generateEventId', () => {
    it('should generate a UUID', () => {
      const id = IdGeneratorUtil.generateEventId();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(36); // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = IdGeneratorUtil.generateEventId();
      const id2 = IdGeneratorUtil.generateEventId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('generateId', () => {
    it('should generate a UUID', () => {
      const id = IdGeneratorUtil.generateId();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(36);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = IdGeneratorUtil.generateId();
      const id2 = IdGeneratorUtil.generateId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('generateUUID', () => {
    it('should generate a UUID', () => {
      const id = IdGeneratorUtil.generateUUID();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(36);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = IdGeneratorUtil.generateUUID();
      const id2 = IdGeneratorUtil.generateUUID();

      expect(id1).not.toBe(id2);
    });
  });

  describe('generateShortId', () => {
    it('should generate a short ID', () => {
      const id = IdGeneratorUtil.generateShortId();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(16);
      expect(id).not.toContain('-');
    });

    it('should generate unique short IDs', () => {
      const id1 = IdGeneratorUtil.generateShortId();
      const id2 = IdGeneratorUtil.generateShortId();

      expect(id1).not.toBe(id2);
    });

    it('should only contain alphanumeric characters', () => {
      const id = IdGeneratorUtil.generateShortId();

      expect(id).toMatch(/^[0-9a-f]{16}$/i);
    });
  });
});

