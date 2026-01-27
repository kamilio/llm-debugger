import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  filterLogs,
  normalizeBaseUrlFilters,
  normalizeBaseUrlValue,
  normalizeAliasFilters,
  normalizeMethodFilters,
  parseCsvParam,
} from '../src/viewer-filters.js';

describe('viewer filters', () => {
  it('parses csv params', () => {
    assert.deepStrictEqual(parseCsvParam(' api.poe.com, openrouter.ai '), [
      'api.poe.com',
      'openrouter.ai',
    ]);
  });

  it('normalizes base URL values', () => {
    assert.strictEqual(
      normalizeBaseUrlValue('https://api.poe.com/v1/chat'),
      'api.poe.com'
    );
    assert.strictEqual(normalizeBaseUrlValue('api.poe.com/v1'), 'api.poe.com');
  });

  it('normalizes and dedupes filter lists', () => {
    assert.deepStrictEqual(
      normalizeBaseUrlFilters(['https://api.poe.com', 'api.poe.com']),
      ['api.poe.com']
    );
    assert.deepStrictEqual(normalizeAliasFilters([' Poe ', 'poe']), ['poe']);
    assert.deepStrictEqual(normalizeMethodFilters(['get', 'POST', 'get']), [
      'GET',
      'POST',
    ]);
  });

  it('filters logs by base URL and method', () => {
    const logs = [
      { request: { url: 'https://api.poe.com/v1', method: 'POST' } },
      { request: { url: 'https://openrouter.ai/v1', method: 'GET' } },
    ];

    const filtered = filterLogs(logs, {
      baseUrls: ['api.poe.com'],
      methods: ['POST'],
    });

    assert.deepStrictEqual(filtered, [logs[0]]);
  });

  it('filters logs by alias name when provided', () => {
    const logs = [
      { request: { url: 'https://api.poe.com/v1', method: 'POST' } },
      { request: { url: 'https://openrouter.ai/v1', method: 'GET' } },
    ];

    const filtered = filterLogs(logs, {
      baseUrls: ['poe'],
      aliasHostMap: { poe: 'api.poe.com' },
    });

    assert.deepStrictEqual(filtered, [logs[0]]);
  });

  it('filters logs by alias filter when provider matches', () => {
    const logs = [
      { provider: 'poe', request: { url: 'https://api.poe.com/v1', method: 'POST' } },
      { provider: 'openrouter', request: { url: 'https://openrouter.ai/v1', method: 'GET' } },
    ];

    const filtered = filterLogs(logs, {
      aliases: ['Poe'],
      aliasHostMap: { poe: 'api.poe.com' },
    });

    assert.deepStrictEqual(filtered, [logs[0]]);
  });

  it('filters logs by alias filter when host matches', () => {
    const logs = [
      { provider: 'api.poe.com', request: { url: 'https://api.poe.com/v1', method: 'POST' } },
      { provider: 'openrouter.ai', request: { url: 'https://openrouter.ai/v1', method: 'GET' } },
    ];

    const filtered = filterLogs(logs, {
      aliases: ['poe'],
      aliasHostMap: { poe: 'api.poe.com' },
    });

    assert.deepStrictEqual(filtered, [logs[0]]);
  });
});
