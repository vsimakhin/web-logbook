import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchSettings } from '../util/http/settings';
import { useErrorNotification } from './useAppNotifications';

const defaultFieldNames = {
  table: {
    date: "Date",
    departure: "Departure",
    dep_place: "Place",
    dep_time: "Time",
    arrival: "Arrival",
    arr_place: "Place",
    arr_time: "Time",
    aircraft: "Aircraft",
    model: "Type",
    reg: "Reg",
    spt: "Single Pilot",
    se: "SE",
    me: "ME",
    mcc: "MCC",
    total: "Total",
    pic_name: "PIC Name",
    landings: "Landings",
    land_day: "Day",
    land_night: "Night",
    oct: "Operational Condition Time",
    night: "Night",
    ifr: "IFR",
    pft: "Pilot Function Time",
    pic: "PIC",
    cop: "COP",
    dual: "Dual",
    instr: "Instr",
    fstd: "FSTD Session",
    sim_type: "Type",
    sim_time: "Time",
    remarks: "Remarks",
  },
  flightRecord: { // flight record page
    date: "Date",
    departure: "Departure",
    dep_place: "Place",
    dep_time: "Time",
    arrival: "Arrival",
    arr_place: "Place",
    arr_time: "Time",
    aircraft: "Aircraft",
    model: "Type",
    reg: "Registration",
    spt: "Single Pilot",
    se: "Single Engine",
    me: "Multi Engine",
    mcc: "MCC",
    total: "Total Time",
    pic_name: "PIC Name",
    landings: "Landings",
    land_day: "Day",
    land_night: "Night",
    // oct: "Operational Condition Time", // not used on flight record page
    night: "Night",
    ifr: "IFR",
    // pft: "Pilot Function Time", // not used on flight record page
    pic: "PIC",
    cop: "Co Pilot",
    dual: "Dual",
    instr: "Instructor",
    fstd: "Simulator",
    sim_type: "Type",
    sim_time: "Time",
    remarks: "Remarks",
  }
}
export const useSettings = () => {
  const navigate = useNavigate();

  // Load settings
  const { data = { standard_fields_headers: {} }, isLoading: isSettingsLoading, isError: isSettingsError, error: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => fetchSettings({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError: isSettingsError, error: settingsError, fallbackMessage: 'Failed to load settings' });

  const paginationOptions = useMemo(() => {
    const defaultOptions = [5, 10, 15, 20, 25, 30, 50, 100];
    if (data?.logbook_pagination) {
      try {
        const options = data.logbook_pagination.split(',').map(opt => parseInt(opt.trim()));
        return options.length > 0 ? options : defaultOptions;
      } catch {
        return defaultOptions;
      }
    }
    return defaultOptions;
  }, [data?.logbook_pagination]);

  /**
   * Get standard field name for a field or column
   * @param {string} fieldId - Field/column identifier
   * @param {boolean} flightRecord - Whether it's for flight record page or tables
   * @returns {string} - field name
   */
  const fieldName = useCallback((fieldId, section = "table") => {
    if (isSettingsLoading) {
      return "";
    }

    // check if custom names for standard fields are enabled
    if (!data?.enable_custom_names) {
      return defaultFieldNames[section][fieldId] || fieldId;
    }

    // Try to get from settings first
    const field = data?.standard_fields_headers?.[fieldId];
    if (field) {
      return field;
    }

    console.warn(`Field not found for: ${fieldId}`);
    return fieldId;
  }, [data, isSettingsLoading]);

  const fieldNameF = useCallback((fieldId) => fieldName(fieldId, "flightRecord"), [fieldName]);

  return {
    settings: data,
    data,
    isLoading: isSettingsLoading,
    fieldName,
    fieldNameF,
    paginationOptions,
  };
};

export default useSettings;
