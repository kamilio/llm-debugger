import net from 'node:net';

function parsePort(value) {
  const port = Number.parseInt(value, 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error('PROXY_PORT must be a valid port (1-65535).');
  }
  return port;
}

export function parsePortSpec(value) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    throw new Error('PROXY_PORT must be set.');
  }

  const rangeMatch = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const start = parsePort(rangeMatch[1]);
    const end = parsePort(rangeMatch[2]);
    if (start > end) {
      throw new Error('PROXY_PORT range start must be <= range end.');
    }
    return { type: 'range', start, end };
  }

  if (/^\d+$/.test(raw)) {
    const port = parsePort(raw);
    return { type: 'fixed', start: port, end: port };
  }

  throw new Error('PROXY_PORT must be a valid port or range (e.g. 8000 or 8000-8010).');
}

function probePort(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error) => {
      server.close();
      if (error.code === 'EADDRINUSE') {
        resolve({ status: 'in_use' });
      } else {
        resolve({ status: 'error', error });
      }
    });

    server.once('listening', () => {
      server.close(() => resolve({ status: 'available' }));
    });

    server.listen(port, host);
  });
}

export async function findAvailablePort(host, spec) {
  for (let port = spec.start; port <= spec.end; port += 1) {
    const result = await probePort(host, port);
    if (result.status === 'available') {
      return port;
    }
    if (result.status === 'in_use') {
      if (spec.type === 'fixed') {
        throw new Error(`Port ${port} is already in use.`);
      }
      continue;
    }
    const message = result.error?.message || 'Unknown error';
    throw new Error(`Failed to check port ${port}: ${message}`);
  }

  throw new Error(`No available ports in range ${spec.start}-${spec.end}.`);
}
