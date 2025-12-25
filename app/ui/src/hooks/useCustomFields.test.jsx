import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useCustomFields from "./useCustomFields";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

// Mock dependencies
vi.mock("react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../util/http/fields", () => ({
  fetchCustomFields: vi.fn(),
}));

describe("useCustomFields", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    // Default mock for useQuery
    useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("should return data and loading states from useQuery", () => {
    useQuery.mockReturnValue({
      data: [{ uuid: "1", name: "Field 1" }],
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useCustomFields());

    expect(result.current.customFields).toEqual([{ uuid: "1", name: "Field 1" }]);
    expect(result.current.isCustomFieldsLoading).toBe(false);
    expect(result.current.isCustomFieldsError).toBe(false);
  });

  describe("getEnroute", () => {
    it("should return null if no enroute field defined in settings", () => {
      useQuery.mockReturnValue({
        data: [{ uuid: "1", type: "text" }],
        isLoading: false,
      });

      const { result } = renderHook(() => useCustomFields());
      const enroute = result.current.getEnroute({ "1": "some text" });

      expect(enroute).toBeNull();
    });

    it("should return null if flight record has no custom fields", () => {
      useQuery.mockReturnValue({
        data: [{ uuid: "e1", type: "enroute" }],
        isLoading: false,
      });

      const { result } = renderHook(() => useCustomFields());
      const enroute = result.current.getEnroute(null);

      expect(enroute).toBeNull();
    });

    it("should correctly parse comma-separated values", () => {
      useQuery.mockReturnValue({
        data: [{ uuid: "e1", type: "enroute" }],
        isLoading: false,
      });

      const { result } = renderHook(() => useCustomFields());
      const enroute = result.current.getEnroute({ "e1": "LIPH, LIMP" });

      expect(enroute).toEqual(["LIPH", "LIMP"]);
    });

    it("should correctly parse space-separated values", () => {
      useQuery.mockReturnValue({
        data: [{ uuid: "e1", type: "enroute" }],
        isLoading: false,
      });

      const { result } = renderHook(() => useCustomFields());
      const enroute = result.current.getEnroute({ "e1": "LIPH LIMP" });

      expect(enroute).toEqual(["LIPH", "LIMP"]);
    });

    it("should correctly parse mixed separators", () => {
      useQuery.mockReturnValue({
        data: [{ uuid: "e1", type: "enroute" }],
        isLoading: false,
      });

      const { result } = renderHook(() => useCustomFields());
      const enroute = result.current.getEnroute({ "e1": "LIPH; LIMP-LIMC" });

      expect(enroute).toEqual(["LIPH", "LIMP", "LIMC"]);
    });

    it("should return null if value is empty", () => {
      useQuery.mockReturnValue({
        data: [{ uuid: "e1", type: "enroute" }],
        isLoading: false,
      });

      const { result } = renderHook(() => useCustomFields());
      const enroute = result.current.getEnroute({ "e1": "   " });

      expect(enroute).toBeNull();
    });
  });
});
