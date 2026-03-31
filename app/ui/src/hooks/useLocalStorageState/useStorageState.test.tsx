import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStorageState } from './useStorageState';

describe('useStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('can do basic local storage with initial value', async () => {
    const { result, rerender } = renderHook(() =>
      useStorageState(window.localStorage, 'foo', 'bar'),
    );

    expect(result.current[0]).toBe('bar');
    act(() => {
      result.current[1]('baz');
    });

    expect(result.current[0]).toBe('baz');
  });

  test('can do basic local storage without initial value', async () => {
    const { result, rerender } = renderHook(() => useStorageState(window.localStorage, 'foo'));

    expect(result.current[0]).toBe(null);
    act(() => {
      result.current[1]('baz');
    });

    expect(result.current[0]).toBe('baz');
  });

  test('can clear storage value, and reset to intiial value', async () => {
    const { result, rerender } = renderHook(() =>
      useStorageState(window.localStorage, 'foo', 'bar'),
    );

    act(() => {
      result.current[1]('baz');
    });

    expect(result.current[0]).toBe('baz');
    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBe('bar');
  });

  test('can clear storage value', async () => {
    const { result, rerender } = renderHook(() => useStorageState(window.localStorage, 'foo'));

    act(() => {
      result.current[1]('baz');
    });

    expect(result.current[0]).toBe('baz');
    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBe(null);
  });

  test('can handle complex types', async () => {
    const { result, rerender } = renderHook(() =>
      useStorageState(window.localStorage, 'foo', { a: 1 }, { codec: JSON }),
    );

    expect(result.current[0]).toEqual({ a: 1 });
    act(() => {
      result.current[1]({ b: 2 });
    });

    expect(result.current[0]).toEqual({ b: 2 });
  });
});
