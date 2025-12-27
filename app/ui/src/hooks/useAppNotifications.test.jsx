import { renderHook } from "@testing-library/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useErrorNotification, useSuccessNotification } from "./useAppNotifications";

// Mock useNotifications
vi.mock("@toolpad/core/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

describe("useAppNotifications", () => {
  const mockShow = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNotifications.mockReturnValue({ show: mockShow });
  });

  describe("useErrorNotification", () => {
    it("should show error notification when isError is true", () => {
      const error = { message: "Test error" };
      renderHook(() =>
        useErrorNotification({
          isError: true,
          error,
          fallbackMessage: "Fallback error",
        })
      );

      expect(mockShow).toHaveBeenCalledWith("Test error", {
        severity: "error",
        key: "Fallback error",
        autoHideDuration: 3000,
      });
    });

    it("should use fallbackMessage if error message is missing", () => {
      const error = {};
      renderHook(() =>
        useErrorNotification({
          isError: true,
          error,
          fallbackMessage: "Fallback error",
        })
      );

      expect(mockShow).toHaveBeenCalledWith("Fallback error", {
        severity: "error",
        key: "Fallback error",
        autoHideDuration: 3000,
      });
    });

    it("should use error.info.message if available", () => {
      const error = { info: { message: "Info message" } };
      renderHook(() =>
        useErrorNotification({
          isError: true,
          error,
          fallbackMessage: "Fallback error",
        })
      );

      expect(mockShow).toHaveBeenCalledWith("Info message", {
        severity: "error",
        key: "Fallback error",
        autoHideDuration: 3000,
      });
    });

    it("should not show notification when isError is false", () => {
      renderHook(() =>
        useErrorNotification({
          isError: false,
          error: { message: "Test error" },
          fallbackMessage: "Fallback error",
        })
      );

      expect(mockShow).not.toHaveBeenCalled();
    });
  });

  describe("useSuccessNotification", () => {
    it("should show success notification when isSuccess is true", () => {
      renderHook(() =>
        useSuccessNotification({
          isSuccess: true,
          message: "Success message",
        })
      );

      expect(mockShow).toHaveBeenCalledWith("Success message", {
        severity: "success",
        key: "Success message",
        autoHideDuration: 3000,
      });
    });

    it("should not show notification when isSuccess is false", () => {
      renderHook(() =>
        useSuccessNotification({
          isSuccess: false,
          message: "Success message",
        })
      );

      expect(mockShow).not.toHaveBeenCalled();
    });
  });
});
