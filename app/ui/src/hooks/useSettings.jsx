import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '../util/http/settings';
import { useErrorNotification } from './useAppNotifications';

const DEFAULT_FIELD_NAMES = {
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
    cc: "XC Time",
    fstd: "FSTD Session",
    sim_type: "Type",
    sim_time: "Time",
    remarks: "Remarks",
    tags: "Tags",
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
    cc: "XC Time",
    fstd: "Simulator",
    sim_type: "Type",
    sim_time: "Time",
    remarks: "Remarks",
    tags: "Tags",
  }
}

const DEFAULT_PAGINATION_OPTIONS = [5, 10, 15, 20, 25, 30, 50, 100];

export const DEFAULT_PROFILE = {
  fieldsVisibility: {
    'departure.place': true,
    'departure.time': true,
    'arrival.place': true,
    'arrival.time': true,
    'landings.day': true,
    'landings.night': true,
    'aircraft.model': true,
    'aircraft.reg_name': true,
    'pic_name': true,
    "time.total_time": true,
    "time.se_time": true,
    "time.me_time": true,
    "time.mcc_time": true,
    "time.night_time": true,
    "time.ifr_time": true,
    "time.pic_time": true,
    "time.co_pilot_time": true,
    "time.dual_time": true,
    "time.instructor_time": true,
    'sim.type': true,
    'sim.time': true,
    'tags': true,
    'remarks': true,
  },
  flightRecordLayout: {
    xl: [
      { i: 'date', x: 0, y: 0, w: 15, h: 1 },
      { i: 'departure.place', x: 0, y: 1, w: 10, h: 1 },
      { i: 'departure.time', x: 1, y: 1, w: 10, h: 1 },
      { i: 'arrival.place', x: 2, y: 1, w: 10, h: 1 },
      { i: 'arrival.time', x: 3, y: 1, w: 10, h: 1 },
      { i: 'landings.day', x: 4, y: 1, w: 10, h: 1 },
      { i: 'landings.night', x: 5, y: 1, w: 10, h: 1 },
      { i: 'aircraft.model', x: 0, y: 2, w: 15, h: 1 },
      { i: 'aircraft.reg_name', x: 1, y: 2, w: 15, h: 1 },
      { i: 'pic_name', x: 2, y: 2, w: 30, h: 1 },
      { i: "time.total_time", x: 0, y: 3, w: 12, h: 1 },
      { i: "time.se_time", x: 1, y: 3, w: 12, h: 1 },
      { i: "time.me_time", x: 2, y: 3, w: 12, h: 1 },
      { i: "time.mcc_time", x: 3, y: 3, w: 12, h: 1 },
      { i: "time.night_time", x: 4, y: 3, w: 12, h: 1 },
      { i: "time.ifr_time", x: 0, y: 4, w: 12, h: 1 },
      { i: "time.pic_time", x: 1, y: 4, w: 12, h: 1 },
      { i: "time.co_pilot_time", x: 2, y: 4, w: 12, h: 1 },
      { i: "time.dual_time", x: 3, y: 4, w: 12, h: 1 },
      { i: "time.instructor_time", x: 4, y: 4, w: 12, h: 1 },
      { i: 'sim.type', x: 0, y: 5, w: 12, h: 1 },
      { i: 'sim.time', x: 1, y: 5, w: 12, h: 1 },
      { i: 'tags', x: 3, y: 5, w: 36, h: 1 },
      { i: 'remarks', x: 0, y: 6, w: 60, h: 1 },
    ],
    lg: [
      { i: 'date', x: 0, y: 0, w: 15, h: 1 },
      { i: 'departure.place', x: 0, y: 1, w: 10, h: 1 },
      { i: 'departure.time', x: 1, y: 1, w: 10, h: 1 },
      { i: 'arrival.place', x: 2, y: 1, w: 10, h: 1 },
      { i: 'arrival.time', x: 3, y: 1, w: 10, h: 1 },
      { i: 'landings.day', x: 4, y: 1, w: 10, h: 1 },
      { i: 'landings.night', x: 5, y: 1, w: 10, h: 1 },
      { i: 'aircraft.model', x: 0, y: 2, w: 15, h: 1 },
      { i: 'aircraft.reg_name', x: 1, y: 2, w: 15, h: 1 },
      { i: 'pic_name', x: 2, y: 2, w: 30, h: 1 },
      { i: "time.total_time", x: 0, y: 3, w: 12, h: 1 },
      { i: "time.se_time", x: 1, y: 3, w: 12, h: 1 },
      { i: "time.me_time", x: 2, y: 3, w: 12, h: 1 },
      { i: "time.mcc_time", x: 3, y: 3, w: 12, h: 1 },
      { i: "time.night_time", x: 4, y: 3, w: 12, h: 1 },
      { i: "time.ifr_time", x: 0, y: 4, w: 12, h: 1 },
      { i: "time.pic_time", x: 1, y: 4, w: 12, h: 1 },
      { i: "time.co_pilot_time", x: 2, y: 4, w: 12, h: 1 },
      { i: "time.dual_time", x: 3, y: 4, w: 12, h: 1 },
      { i: "time.instructor_time", x: 4, y: 4, w: 12, h: 1 },
      { i: 'sim.type', x: 0, y: 5, w: 12, h: 1 },
      { i: 'sim.time', x: 1, y: 5, w: 12, h: 1 },
      { i: 'tags', x: 3, y: 5, w: 36, h: 1 },
      { i: 'remarks', x: 0, y: 6, w: 60, h: 1 },
    ],
    md: [
      { i: 'date', x: 0, y: 0, w: 15, h: 1 },
      { i: 'departure.place', x: 0, y: 1, w: 10, h: 1 },
      { i: 'departure.time', x: 1, y: 1, w: 10, h: 1 },
      { i: 'arrival.place', x: 2, y: 1, w: 10, h: 1 },
      { i: 'arrival.time', x: 3, y: 1, w: 10, h: 1 },
      { i: 'landings.day', x: 4, y: 1, w: 10, h: 1 },
      { i: 'landings.night', x: 5, y: 1, w: 10, h: 1 },
      { i: 'aircraft.model', x: 0, y: 2, w: 15, h: 1 },
      { i: 'aircraft.reg_name', x: 1, y: 2, w: 15, h: 1 },
      { i: 'pic_name', x: 2, y: 2, w: 30, h: 1 },
      { i: "time.total_time", x: 0, y: 3, w: 12, h: 1 },
      { i: "time.se_time", x: 1, y: 3, w: 12, h: 1 },
      { i: "time.me_time", x: 2, y: 3, w: 12, h: 1 },
      { i: "time.mcc_time", x: 3, y: 3, w: 12, h: 1 },
      { i: "time.night_time", x: 4, y: 3, w: 12, h: 1 },
      { i: "time.ifr_time", x: 0, y: 4, w: 12, h: 1 },
      { i: "time.pic_time", x: 1, y: 4, w: 12, h: 1 },
      { i: "time.co_pilot_time", x: 2, y: 4, w: 12, h: 1 },
      { i: "time.dual_time", x: 3, y: 4, w: 12, h: 1 },
      { i: "time.instructor_time", x: 4, y: 4, w: 12, h: 1 },
      { i: 'sim.type', x: 0, y: 5, w: 12, h: 1 },
      { i: 'sim.time', x: 1, y: 5, w: 12, h: 1 },
      { i: 'tags', x: 3, y: 5, w: 36, h: 1 },
      { i: 'remarks', x: 0, y: 6, w: 60, h: 1 },
    ],
    sm: [
      { i: 'date', x: 0, y: 0, w: 60, h: 1 },
      { i: 'departure.place', x: 0, y: 1, w: 30, h: 1 },
      { i: 'departure.time', x: 1, y: 1, w: 30, h: 1 },
      { i: 'arrival.place', x: 0, y: 2, w: 30, h: 1 },
      { i: 'arrival.time', x: 1, y: 2, w: 30, h: 1 },
      { i: 'landings.day', x: 0, y: 3, w: 30, h: 1 },
      { i: 'landings.night', x: 1, y: 3, w: 30, h: 1 },
      { i: 'aircraft.model', x: 0, y: 4, w: 30, h: 1 },
      { i: 'aircraft.reg_name', x: 1, y: 4, w: 30, h: 1 },
      { i: 'pic_name', x: 0, y: 5, w: 60, h: 1 },
      { i: "time.total_time", x: 0, y: 6, w: 30, h: 1 },
      { i: "time.se_time", x: 1, y: 6, w: 30, h: 1 },
      { i: "time.me_time", x: 0, y: 7, w: 30, h: 1 },
      { i: "time.mcc_time", x: 1, y: 7, w: 30, h: 1 },
      { i: "time.night_time", x: 0, y: 8, w: 30, h: 1 },
      { i: "time.ifr_time", x: 1, y: 8, w: 30, h: 1 },
      { i: "time.pic_time", x: 0, y: 9, w: 30, h: 1 },
      { i: "time.co_pilot_time", x: 1, y: 9, w: 30, h: 1 },
      { i: "time.dual_time", x: 0, y: 10, w: 30, h: 1 },
      { i: "time.instructor_time", x: 1, y: 10, w: 30, h: 1 },
      { i: 'sim.type', x: 0, y: 11, w: 30, h: 1 },
      { i: 'sim.time', x: 1, y: 11, w: 30, h: 1 },
      { i: 'tags', x: 0, y: 12, w: 60, h: 1 },
      { i: 'remarks', x: 0, y: 13, w: 60, h: 1 },
    ],
    xs: [
      { i: 'date', x: 0, y: 0, w: 60, h: 1 },
      { i: 'departure.place', x: 0, y: 1, w: 30, h: 1 },
      { i: 'departure.time', x: 1, y: 1, w: 30, h: 1 },
      { i: 'arrival.place', x: 0, y: 2, w: 30, h: 1 },
      { i: 'arrival.time', x: 1, y: 2, w: 30, h: 1 },
      { i: 'landings.day', x: 0, y: 3, w: 30, h: 1 },
      { i: 'landings.night', x: 1, y: 3, w: 30, h: 1 },
      { i: 'aircraft.model', x: 0, y: 4, w: 30, h: 1 },
      { i: 'aircraft.reg_name', x: 1, y: 4, w: 30, h: 1 },
      { i: 'pic_name', x: 0, y: 5, w: 60, h: 1 },
      { i: "time.total_time", x: 0, y: 6, w: 30, h: 1 },
      { i: "time.se_time", x: 1, y: 6, w: 30, h: 1 },
      { i: "time.me_time", x: 0, y: 7, w: 30, h: 1 },
      { i: "time.mcc_time", x: 1, y: 7, w: 30, h: 1 },
      { i: "time.night_time", x: 0, y: 8, w: 30, h: 1 },
      { i: "time.ifr_time", x: 1, y: 8, w: 30, h: 1 },
      { i: "time.pic_time", x: 0, y: 9, w: 30, h: 1 },
      { i: "time.co_pilot_time", x: 1, y: 9, w: 30, h: 1 },
      { i: "time.dual_time", x: 0, y: 10, w: 30, h: 1 },
      { i: "time.instructor_time", x: 1, y: 10, w: 30, h: 1 },
      { i: 'sim.type', x: 0, y: 11, w: 30, h: 1 },
      { i: 'sim.time', x: 1, y: 11, w: 30, h: 1 },
      { i: 'tags', x: 0, y: 12, w: 60, h: 1 },
      { i: 'remarks', x: 0, y: 13, w: 60, h: 1 },
    ]
  }
};


export const useSettings = () => {
  // Load settings
  const { data = { standard_fields_headers: {} }, isLoading: isSettingsLoading, isError: isSettingsError, error: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => fetchSettings({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError: isSettingsError, error: settingsError, fallbackMessage: 'Failed to load settings' });

  const paginationOptions = useMemo(() => {
    if (!data?.logbook_pagination) {
      return DEFAULT_PAGINATION_OPTIONS;
    }

    const options = data.logbook_pagination.split(',').map(opt => parseInt(opt.trim())).filter(num => !Number.isNaN(num));;
    return options.length > 0 ? options : DEFAULT_PAGINATION_OPTIONS;
  }, [data.logbook_pagination]);

  /**
   * Get standard field name for a field or column
   * @param {string} fieldId - Field/column identifier
   * @param {string} section [table|flightRecord] - Whether it's for flight record page or tables
   * @returns {string} - field name
   */
  const fieldName = useCallback((fieldId, section = "table") => {
    if (isSettingsLoading) {
      return "";
    }

    // check if custom names for standard fields are enabled
    if (!data?.enable_custom_names) {
      return DEFAULT_FIELD_NAMES[section][fieldId] || fieldId;
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

  const logbookProfile = useMemo(() => ({
    fieldsVisibility: data.logbook_profile?.fields_visibility ?? DEFAULT_PROFILE.fieldsVisibility,
    flightRecordLayout: data.logbook_profile?.flight_record_layout ?? DEFAULT_PROFILE.flightRecordLayout,
    tableColumns: data.logbook_profile?.table_columns ?? [],
  }), [data.logbook_profile]);



  return {
    settings: data,
    data,
    isLoading: isSettingsLoading,
    fieldName,
    fieldNameF,
    paginationOptions,
    timeFieldsFormat: data.time_fields_auto_format || 1,
    dateFieldsFormat: data.date_fields_format || "DD/MM/YYYY",
    logbookProfile,
  };
};

export default useSettings;
