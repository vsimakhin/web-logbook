import "@testing-library/jest-dom";

if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
  const storage = new Map();

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key) => (storage.has(String(key)) ? storage.get(String(key)) : null),
      setItem: (key, value) => storage.set(String(key), String(value)),
      removeItem: (key) => storage.delete(String(key)),
      clear: () => storage.clear(),
      key: (index) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size;
      },
    },
    configurable: true,
    enumerable: true,
    writable: false,
  });
}
