import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
// Custom
import { fetchCustomFields } from "../util/http/fields";
import { useErrorNotification } from "./useAppNotifications";
import { fetchDistance } from "../util/http";

export const useCustomFields = () => {
  const { data = [], isError, error, isLoading } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: ({ signal }) => fetchCustomFields({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load custom fields' });

  const enrouteField = data?.find?.(f => f.type === 'enroute');

  /**
   * Get enroute airport codes from flight record custom fields
   * @param {object} frCustomFields - Custom fields object from flight record
   * @returns {array|null} - Array of airport codes or null if not found
   */
  const getEnroute = useCallback((frCustomFields) => {
    if (!enrouteField || !frCustomFields) return null;

    const value = frCustomFields[enrouteField.uuid];
    if (!value) return null;

    const codes = value.split(/[,;\s-]+/).map(code => code.trim().toUpperCase()).filter(code => code.length > 0);

    return codes.length > 0 ? codes : null;
  }, [enrouteField]);


  const calculateDistance = useCallback(async (flight) => {
    if (!flight) return 0;

    const enrouteAirports = getEnroute(flight.custom_fields);

    const fullRoute = enrouteAirports
      ? [flight.departure.place, ...enrouteAirports, flight.arrival.place,]
      : [flight.departure.place, flight.arrival.place];

    let totalDistance = 0;

    for (let i = 0; i < fullRoute.length - 1; i++) {
      const legDistance = await fetchDistance({ departure: fullRoute[i], arrival: fullRoute[i + 1] });

      if (legDistance) {
        totalDistance += legDistance;
      }
    }

    return totalDistance;
  }, [getEnroute]);

  return {
    data: data || [],
    customFields: data || [],
    isCustomFieldsLoading: isLoading,
    isCustomFieldsError: isError,
    customFieldsError: error,
    getEnroute,
    calculateDistance,
  }
};

export default useCustomFields;