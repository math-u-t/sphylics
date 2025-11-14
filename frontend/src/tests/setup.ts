/**
 * Vitest Setup File
 * Global test configuration and mocks
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Mock crypto.subtle for PKCE tests
global.crypto = {
  ...global.crypto,
  subtle: {
    digest: vi.fn((algorithm, data) => {
      // Simple mock implementation for testing
      return Promise.resolve(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    })
  } as any,
  getRandomValues: vi.fn((array: Uint8Array) => {
    // Fill with predictable values for testing
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256;
    }
    return array;
  })
} as any;

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Clear all mocks and storage before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});
