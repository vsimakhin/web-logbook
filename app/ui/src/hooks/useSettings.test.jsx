import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useSettings, { defaultFieldNames } from "./useSettings";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("../util/http/settings", () => ({
  fetchSettings: vi.fn(),
}));

vi.mock("./useAppNotifications", () => ({
  useErrorNotification: vi.fn(),
}));

describe("useSettings", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    // Default useQuery mock to return loading state initially or minimal data
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  describe("paginationOptions", () => {
    it("should return default options if no settings", () => {
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
      });
      const { result } = renderHook(() => useSettings());
      expect(result.current.paginationOptions).toEqual([5, 10, 15, 20, 25, 30, 50, 100]);
    });

    it("should return parsed options from settings", () => {
      const mockSettings = { logbook_pagination: "10, 20, 100" };
      useQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });
      const { result } = renderHook(() => useSettings());
      // Wait for useEffect to update state
      waitFor(() => {
        expect(result.current.paginationOptions).toEqual([10, 20, 100]);
      })

    });
    it("should return default options if parsing fails", () => {
      const mockSettings = { logbook_pagination: "invalid, string" };
      useQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });
      const { result } = renderHook(() => useSettings());
      waitFor(() => {
        expect(result.current.paginationOptions).toEqual([5, 10, 15, 20, 25, 30, 50, 100]);
      })
    });
  });

  describe("fieldName", () => {
    it("should return empty string if loading", () => {
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });
      const { result } = renderHook(() => useSettings());
      expect(result.current.fieldName("date")).toBe("");
    });

    it("should return default name if custom names disabled", () => {
      const mockSettings = { enable_custom_names: false };
      useQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });
      const { result } = renderHook(() => useSettings());
      waitFor(() => {
        expect(result.current.fieldName("date")).toBe(defaultFieldNames.table.date);
      })
    });

    it("should return custom name if enabled and exists", () => {
      const mockSettings = {
        enable_custom_names: true,
        standard_fields_headers: { date: "Custom Date" }
      };
      useQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });
      const { result } = renderHook(() => useSettings());
      waitFor(() => {
        expect(result.current.fieldName("date")).toBe("Custom Date");
      })
    });

    it("should return fieldId if custom name missing", () => {
      const mockSettings = {
        enable_custom_names: true,
        standard_fields_headers: {}
      };
      useQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });
      const { result } = renderHook(() => useSettings());
      waitFor(() => {
        // Should fallback to fieldId and warn
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        expect(result.current.fieldName("unknown_field")).toBe("unknown_field");
        expect(consoleSpy).toHaveBeenCalledWith("Field not found for: unknown_field");
        consoleSpy.mockRestore();
      })
    });
  });

  describe("fieldNameF", () => {
    it("should call fieldName with flightRecord section", () => {
      // We can infer this by checking the return value for a field specific to flight record or mocked behavior,
      // but since fieldName logic handles sections internally, we test if it resolves correctly using flightRecord defaults
      const mockSettings = { enable_custom_names: false };
      useQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });

      const { result } = renderHook(() => useSettings());
      waitFor(() => {
        expect(result.current.fieldNameF("date")).toBe(defaultFieldNames.flightRecord.date);
      })
    });
  });

  it("should return the correct set of parameters", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current).toHaveProperty("settings");
    expect(result.current).toHaveProperty("setSettings");
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("fieldName");
    expect(result.current).toHaveProperty("fieldNameF");
    expect(result.current).toHaveProperty("paginationOptions");
  });
});
