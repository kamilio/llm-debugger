import { describe, it } from 'node:test';
import assert from 'node:assert';
import net from 'node:net';
import { findAvailablePort, parsePortSpec } from '../src/ports.js';

const HOST = '127.0.0.1';

function createServer(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, HOST, () => resolve(server));
  });
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, HOST);
  });
}

async function findConsecutivePorts(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const server = await createServer(0);
    const { port } = server.address();
    await new Promise((resolve) => server.close(resolve));
    if (await canListen(port + 1)) {
      return port;
    }
  }
  throw new Error('Unable to find consecutive free ports for testing.');
}

describe('parsePortSpec', () => {
  it('parses fixed ports', () => {
    assert.deepStrictEqual(parsePortSpec('8000'), {
      type: 'fixed',
      start: 8000,
      end: 8000,
    });
  });

  it('parses port ranges', () => {
    assert.deepStrictEqual(parsePortSpec('8000-8010'), {
      type: 'range',
      start: 8000,
      end: 8010,
    });
  });

  it('rejects invalid port specs', () => {
    assert.throws(() => parsePortSpec(''), /PROXY_PORT/);
    assert.throws(() => parsePortSpec('abc'), /PROXY_PORT/);
    assert.throws(() => parsePortSpec('70000'), /PROXY_PORT/);
    assert.throws(() => parsePortSpec('8001-8000'), /range start/);
  });
});

describe('findAvailablePort', () => {
  it('picks the next port in range when the first is occupied', async () => {
    const basePort = await findConsecutivePorts();
    const server = await createServer(basePort);
    try {
      const port = await findAvailablePort(HOST, {
        type: 'range',
        start: basePort,
        end: basePort + 1,
      });
      assert.strictEqual(port, basePort + 1);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('fails for fixed port when occupied', async () => {
    const server = await createServer(0);
    const { port } = server.address();
    try {
      await assert.rejects(
        () => findAvailablePort(HOST, { type: 'fixed', start: port, end: port }),
        /already in use/
      );
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('errors when all ports in range are occupied', async () => {
    const basePort = await findConsecutivePorts();
    const serverA = await createServer(basePort);
    const serverB = await createServer(basePort + 1);
    try {
      await assert.rejects(
        () =>
          findAvailablePort(HOST, {
            type: 'range',
            start: basePort,
            end: basePort + 1,
          }),
        new RegExp(`range ${basePort}-${basePort + 1}`)
      );
    } finally {
      await new Promise((resolve) => serverA.close(resolve));
      await new Promise((resolve) => serverB.close(resolve));
    }
  });
});
