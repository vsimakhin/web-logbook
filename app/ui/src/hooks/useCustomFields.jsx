import { useQuery } from "@tanstack/react-query";
// Custom
import { fetchCustomFields } from "../util/http/fields";
import { useErrorNotification } from "./useAppNotifications";
import { useCallback } from "react";

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

  return {
    data,
    customFields: data,
    isCustomFieldsLoading: isLoading,
    isCustomFieldsError: isError,
    customFieldsError: error,
    getEnroute,
  }
};

export default useCustomFields;