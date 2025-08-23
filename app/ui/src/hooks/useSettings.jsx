import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchSettings } from '../util/http/settings';
import { useErrorNotification } from './useAppNotifications';

export const useSettings = () => {
  const navigate = useNavigate();

  // Load settings
  const { data: settings, isLoading: isSettingsLoading, isError: isSettingsError, error: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => fetchSettings({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError: isSettingsError, error: settingsError, fallbackMessage: 'Failed to load settings' });

  const paginationOptions = useMemo(() => {
    const defaultOptions = [5, 10, 15, 20, 25, 30, 50, 100];
    if (settings?.logbook_pagination) {
      try {
        const options = settings.logbook_pagination.split(',').map(opt => parseInt(opt.trim()));
        return options.length > 0 ? options : defaultOptions;
      } catch (error) {
        return defaultOptions;
      }
    }
    return defaultOptions;
  }, [settings?.logbook_pagination]);

  /**
   * Get standard field name for a column
   * @param {string} column - Column identifier
   * @param {string} defaultText - Default text if no field found
   * @returns {string} - field name
   */
  const getStandardFieldName = useCallback((column) => {
    if (isSettingsLoading) {
      return "";
    }

    // Try to get from settings first
    const field = settings?.standard_fields_headers?.[column];
    if (field) {
      return field;
    }

    console.warn(`Field not found for column: ${column}`);
    return column;
  }, [settings, isSettingsLoading]);

  return {
    settings,
    data: settings,
    isLoading: isSettingsLoading,
    getStandardFieldName,
    paginationOptions,
  };
};

export default useSettings;
