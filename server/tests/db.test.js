'use strict';

/**
 * tests/db.test.js — Unit tests for the database connection service.
 *
 * Verifies:
 *   1. Successful connection calls mongoose.connect with config.mongodbUri and timeout options.
 *   2. Reconnection idempotency: does not call mongoose.connect if readyState === 1.
 *   3. In-flight deduplication: concurrent calls share the same connection promise.
 *   4. Connection failure: propagates the error thrown by mongoose.connect.
 *   5. Disconnection: calls mongoose.disconnect when active.
 *   6. Disconnection idempotency: no-op when already disconnected (readyState === 0).
 */

const mongoose = require('mongoose');
const { connectDB, disconnectDB, _resetDbState } = require('../src/config/db');
const config = require('../src/config/env');

describe('Database Connection Service (src/config/db.js)', () => {
  let originalReadyState;

  beforeEach(() => {
    jest.clearAllMocks();
    _resetDbState();
    originalReadyState = mongoose.connection.readyState;
  });

  afterEach(() => {
    _resetDbState();
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: originalReadyState,
      configurable: true,
      writable: true,
    });
  });

  describe('connectDB', () => {
    it('connects to MongoDB with configured URI and options', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        configurable: true,
        writable: true,
      });

      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockResolvedValueOnce(mongoose.connection);

      const conn = await connectDB();

      expect(connectSpy).toHaveBeenCalledWith(
        config.mongodbUri,
        expect.objectContaining({ serverSelectionTimeoutMS: 5000 })
      );
      expect(conn).toBe(mongoose.connection);

      connectSpy.mockRestore();
    });

    it('returns existing connection if already connected (readyState 1)', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        configurable: true,
        writable: true,
      });

      const connectSpy = jest.spyOn(mongoose, 'connect');

      const conn = await connectDB();

      expect(connectSpy).not.toHaveBeenCalled();
      expect(conn).toBe(mongoose.connection);

      connectSpy.mockRestore();
    });

    it('deduplicates concurrent in-flight connection calls', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        configurable: true,
        writable: true,
      });

      let resolveConnect;
      const connectPromise = new Promise((resolve) => {
        resolveConnect = resolve;
      });

      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockReturnValueOnce(connectPromise);

      // Trigger two simultaneous connectDB calls
      const p1 = connectDB();
      const p2 = connectDB();

      // Resolve the mock connection
      resolveConnect(mongoose.connection);

      const [conn1, conn2] = await Promise.all([p1, p2]);

      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(conn1).toBe(mongoose.connection);
      expect(conn2).toBe(mongoose.connection);

      connectSpy.mockRestore();
    });

    it('propagates error when mongoose.connect fails', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        configurable: true,
        writable: true,
      });

      const dbError = new Error('Atlas cluster connection timeout');
      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockRejectedValueOnce(dbError);

      await expect(connectDB()).rejects.toThrow('Atlas cluster connection timeout');

      connectSpy.mockRestore();
    });
  });

  describe('disconnectDB', () => {
    it('calls mongoose.disconnect when connection is open (readyState 1)', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        configurable: true,
        writable: true,
      });

      const disconnectSpy = jest
        .spyOn(mongoose, 'disconnect')
        .mockResolvedValueOnce();

      await disconnectDB();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);

      disconnectSpy.mockRestore();
    });

    it('does not call mongoose.disconnect when already disconnected (readyState 0)', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        configurable: true,
        writable: true,
      });

      const disconnectSpy = jest.spyOn(mongoose, 'disconnect');

      await disconnectDB();

      expect(disconnectSpy).not.toHaveBeenCalled();

      disconnectSpy.mockRestore();
    });
  });
});
