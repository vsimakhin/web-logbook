import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useLogbook from "./useLogbook";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import useCustomFields from "./useCustomFields";

// Mock dependencies
vi.mock("react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
}));

vi.mock("./useCustomFields", () => ({
  default: vi.fn(),
}));

vi.mock("../util/http/logbook", () => ({
  fetchDistance: vi.fn(),
  fetchNightTime: vi.fn(),
}));

vi.mock("./useAppNotifications", () => ({
  useErrorNotification: vi.fn(),
}));

describe("useLogbook", () => {
  const mockNavigate = vi.fn();
  const mockGetEnroute = vi.fn();
  const mockMutateDistance = vi.fn();
  const mockMutateNightTime = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useCustomFields.mockReturnValue({ getEnroute: mockGetEnroute });

    // Mock useMutation to return specific mutation functions based on usage
    // Since useMutation is called twice, we need to handle it carefully.
    // The first call is for getDistance, the second for getNightTime.
    useMutation
      .mockReturnValueOnce({ mutateAsync: mockMutateDistance }) // getDistance
      .mockReturnValueOnce({ mutateAsync: mockMutateNightTime, isError: false, error: null }); // getNightTime
  });

  describe("calculateDistance", () => {
    it("should return 0 if no flight provided", async () => {
      const { result } = renderHook(() => useLogbook());
      const distance = await result.current.calculateDistance(null);
      expect(distance).toBe(0);
    });

    it("should calculate direct distance when no enroute stops", async () => {
      const flight = {
        departure: { place: "LIMP" },
        arrival: { place: "LIMJ" },
        custom_fields: {},
      };
      mockGetEnroute.mockReturnValue(null);
      mockMutateDistance.mockResolvedValue(150);

      const { result } = renderHook(() => useLogbook());
      const distance = await result.current.calculateDistance(flight);

      expect(mockGetEnroute).toHaveBeenCalledWith(flight.custom_fields);
      expect(mockMutateDistance).toHaveBeenCalledTimes(1);
      expect(mockMutateDistance).toHaveBeenCalledWith({ departure: "LIMP", arrival: "LIMJ" });
      expect(distance).toBe(150);
    });

    it("should sum distances for flights with enroute stops", async () => {
      const flight = {
        departure: { place: "LIMP" },
        arrival: { place: "LIMJ" },
        custom_fields: { enroute: "LIPH" },
      };
      // Mock enroute stops [LIPH]
      mockGetEnroute.mockReturnValue(["LIPH"]);

      // Mock distances: LIMP->LIPH = 50, LIPH->LIMJ = 100
      mockMutateDistance
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(100);

      const { result } = renderHook(() => useLogbook());
      const distance = await result.current.calculateDistance(flight);

      expect(mockGetEnroute).toHaveBeenCalledWith(flight.custom_fields);
      expect(mockMutateDistance).toHaveBeenCalledTimes(2);
      expect(mockMutateDistance).toHaveBeenNthCalledWith(1, { departure: "LIMP", arrival: "LIPH" });
      expect(mockMutateDistance).toHaveBeenNthCalledWith(2, { departure: "LIPH", arrival: "LIMJ" });
      expect(distance).toBe(150);
    });

    it("should handle missing leg distances gracefully", async () => {
      const flight = {
        departure: { place: "A" },
        arrival: { place: "C" },
        custom_fields: {},
      };
      mockGetEnroute.mockReturnValue(["B"]);

      // A->B fails/returns null, B->C returns 100
      mockMutateDistance
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(100);

      const { result } = renderHook(() => useLogbook());
      const distance = await result.current.calculateDistance(flight);

      expect(distance).toBe(100);
    });
  });

  describe("calculateNightTime", () => {
    it("should return 0 if no flight provided", async () => {
      useMutation
        .mockReturnValueOnce({ mutateAsync: mockMutateDistance })
        .mockReturnValueOnce({ mutateAsync: mockMutateNightTime, isError: false, error: null });

      const { result } = renderHook(() => useLogbook());
      const nightTime = await result.current.calculateNightTime(null);
      expect(nightTime).toBe(0);
    });

    it("should return fetched night time from API", async () => {
      useMutation
        .mockReturnValueOnce({ mutateAsync: mockMutateDistance })
        .mockReturnValueOnce({ mutateAsync: mockMutateNightTime, isError: false, error: null });

      const flight = { id: 1 };
      mockMutateNightTime.mockResolvedValue(45);

      const { result } = renderHook(() => useLogbook());
      const nightTime = await result.current.calculateNightTime(flight);

      expect(mockMutateNightTime).toHaveBeenCalledWith({ flight });
      expect(nightTime).toBe(45);
    });

    it("should default to 0 if API returns null", async () => {
      useMutation
        .mockReturnValueOnce({ mutateAsync: mockMutateDistance })
        .mockReturnValueOnce({ mutateAsync: mockMutateNightTime, isError: false, error: null });

      const flight = { id: 1 };
      mockMutateNightTime.mockResolvedValue(null);

      const { result } = renderHook(() => useLogbook());
      const nightTime = await result.current.calculateNightTime(flight);

      expect(nightTime).toBe(0);
    });
  });

  describe("calculateTotalTime", () => {
    // We need to re-mock useMutation for these tests as well since it's called in the hook body
    beforeEach(() => {
      useMutation
        .mockReturnValueOnce({ mutateAsync: mockMutateDistance })
        .mockReturnValueOnce({ mutateAsync: mockMutateNightTime, isError: false, error: null });
    });

    it("should calculate duration for same-day flights", () => {
      const flight = {
        departure: { time: "1000" },
        arrival: { time: "1130" },
      };

      const { result } = renderHook(() => useLogbook());
      const totalTime = result.current.calculateTotalTime(flight);

      expect(totalTime).toBe("1:30");
    });

    it("should calculate duration for overnight flights", () => {
      const flight = {
        departure: { time: "2300" }, // 11:00 PM
        arrival: { time: "0100" },   // 01:00 AM next day
      };

      const { result } = renderHook(() => useLogbook());
      const totalTime = result.current.calculateTotalTime(flight);

      expect(totalTime).toBe("2:00");
    });

    it("should pad minutes with zero", () => {
      const flight = {
        departure: { time: "1000" },
        arrival: { time: "1005" },
      };

      const { result } = renderHook(() => useLogbook());
      const totalTime = result.current.calculateTotalTime(flight);

      expect(totalTime).toBe("0:05");
    });
  });
});
