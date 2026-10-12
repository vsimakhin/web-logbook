import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchNightTime } from "../../util/http/logbook";
import { useErrorNotification } from "../useAppNotifications";

export const useNightTime = () => {
  const { mutateAsync: getNightTime, isError, error, } = useMutation({
    mutationFn: ({ signal, flight }) => fetchNightTime({ flight, signal }),
  });

  useErrorNotification({ isError, error, fallbackMessage: "Failed to calculate night time" });

  const calculateNightTime = useCallback(async (flight) => {
    if (!flight) return 0;

    const nightTime = await getNightTime({ flight });
    return nightTime || 0;
  }, [getNightTime]);

  return calculateNightTime;
};