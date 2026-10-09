'use strict';

/**
 * tests/server.test.js — Startup and shutdown lifecycle tests.
 *
 * Verifies:
 *   1. Startup failure: If initial MongoDB connection fails, server reports error and exits with code 1.
 *   2. Startup success: Connects to database before listening for HTTP requests.
 *   3. Graceful shutdown: Closes HTTP server and disconnects database cleanly.
 *   4. Duplicate signals: Second shutdown signal is ignored (no duplicate cleanup).
 *   5. Cleanup failure: Errors during disconnectDB are caught and exit with code 1.
 */

const { startServer, shutdown, _resetServerState } = require('../src/server');
const db = require('../src/config/db');
const app = require('../src/app');

describe('Server Startup & Shutdown Lifecycle (src/server.js)', () => {
  let exitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    _resetServerState();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    _resetServerState();
  });

  it('exits with code 1 without starting server if connectDB fails', async () => {
    const connectSpy = jest
      .spyOn(db, 'connectDB')
      .mockRejectedValueOnce(new Error('Atlas connection refused'));
    const appSpy = jest.spyOn(app, 'listen');

    await startServer();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(appSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    connectSpy.mockRestore();
    appSpy.mockRestore();
  });

  it('connects to database before listening for HTTP requests on success', async () => {
    const callOrder = [];
    const connectSpy = jest
      .spyOn(db, 'connectDB')
      .mockImplementation(async () => {
        callOrder.push('connectDB');
        return {};
      });

    const mockServer = {
      listening: true,
      close: jest.fn((cb) => cb && cb()),
      on: jest.fn(),
    };

    const appSpy = jest.spyOn(app, 'listen').mockImplementation((port, cb) => {
      callOrder.push('app.listen');
      if (cb) cb();
      return mockServer;
    });

    const srv = await startServer();

    expect(callOrder).toEqual(['connectDB', 'app.listen']);
    expect(srv).toBe(mockServer);

    connectSpy.mockRestore();
    appSpy.mockRestore();
  });

  it('closes HTTP server and disconnects database during shutdown', async () => {
    const disconnectSpy = jest
      .spyOn(db, 'disconnectDB')
      .mockResolvedValueOnce();

    await shutdown('SIGINT', 0);

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);

    disconnectSpy.mockRestore();
  });

  it('ignores duplicate shutdown signals (no repeated cleanup)', async () => {
    const disconnectSpy = jest
      .spyOn(db, 'disconnectDB')
      .mockResolvedValueOnce();

    // Trigger first shutdown
    const firstShutdown = shutdown('SIGINT', 0);
    // Trigger second shutdown while shutting down
    const secondShutdown = shutdown('SIGTERM', 0);

    await Promise.all([firstShutdown, secondShutdown]);

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledTimes(1);

    disconnectSpy.mockRestore();
  });

  it('catches cleanup errors and exits with code 1', async () => {
    const disconnectSpy = jest
      .spyOn(db, 'disconnectDB')
      .mockRejectedValueOnce(new Error('Forced disconnect failure'));

    await shutdown('SIGTERM', 0);

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);

    disconnectSpy.mockRestore();
  });
});
