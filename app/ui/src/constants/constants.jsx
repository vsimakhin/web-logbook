import dayjs from 'dayjs';

export const DRAWER_WIDTH = 200;

export const TOKEN_KEY = 'token';
export const USERNAME_KEY = 'username';

export let API_URL = '/api';
if (import.meta.env.MODE === 'development') {
  API_URL = 'http://localhost:4000/api';
}

export const FLIGHT_INITIAL_STATE = {
  uuid: "",
  date: dayjs().format('DD/MM/YYYY'),
  departure: {
    place: "",
    time: ""
  },
  arrival: {
    place: "",
    time: ""
  },
  aircraft: {
    model: "",
    reg_name: ""
  },
  time: {
    se_time: "",
    me_time: "",
    mcc_time: "",
    total_time: "",
    night_time: "",
    ifr_time: "",
    pic_time: "",
    co_pilot_time: "",
    dual_time: "",
    instructor_time: ""
  },
  landings: {
    day: "",
    night: ""
  },
  sim: {
    type: "",
    time: ""
  },
  pic_name: "",
  remarks: ""
};

export const LICENSE_INITIAL_STATE = {
  uuid: "",
  category: "",
  name: "",
  number: "",
  issued: dayjs().format('DD/MM/YYYY'),
  valid_from: dayjs().format('DD/MM/YYYY'),
  valid_until: dayjs().format('DD/MM/YYYY'),
  document_name: "",
  document: "",
  remarks: ""
};

export const PLACE_SLOT_PROPS = {
  htmlInput: { style: { textTransform: 'uppercase' }, onInput: (e) => { e.target.value = e.target.value.toUpperCase() } }
}
export const TIME_SLOT_PROPS = {
  htmlInput: { maxLength: 4, onInput: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, '') }, inputMode: 'numeric' }
}

export const FLIGHT_TIME_SLOT_PROPS = {
  htmlInput: {
    maxLength: 5, // HH:MM or H:MM format requires max length of 5
    onInput: (e) => {
      let value = e.target.value;

      // Remove invalid characters
      value = value.replace(/[^0-9]/g, '');

      // Automatically add colon after 1 or 2 digits for hours
      if (value.length > 2) {
        value = `${value.slice(0, value.length - 2)}:${value.slice(-2)}`;
      }

      // Split hours and minutes for validation
      const [hours, minutes] = value.split(':');

      // Ensure hours are valid (no specific upper limit but can be capped if needed)
      if (hours && parseInt(hours, 10) > 99) {
        value = `${hours.slice(0, 2)}:${minutes || ''}`;
      }

      // Allow clearing or partial input
      e.target.value = value;
    },
    inputMode: 'numeric'
  },
};

export const tableJSONCodec = {
  parse: (value) => {
    try {
      return JSON.parse(value)
    } catch {
      return {};
    }
  },
  stringify: (value) => JSON.stringify(value),
}

export const defaultColumnFilterTextFieldProps = ({ column }) => {
  const headerText = typeof column.columnDef.header === 'object' ? column.columnDef.header.props.title : column.columnDef.header;

  return {
    label: `Filter by ${headerText}`,
    placeholder: '',
    InputLabelProps: { shrink: true },
  }
};

export const CURRENCY_INITIAL_STATE = {
  uuid: "new",
  name: "New Currency",
  metric: "time.total_time",
  target_value: 0,
  comparison: ">=",
  time_frame: {
    unit: "days",
    value: 90
  },
  filters: "",
};

export const CUSTOM_FIELD_INITIAL_STATE = {
  uuid: "new",
  name: "New Custom Field",
  description: "",
  category: "Custom",
  type: "text",
  stats_function: "none",
  size_xs: 3,
  size_md: 3,
  size_lg: 3,
  display_order: 0,
};

export const FIELDS_VISIBILITY_KEY = "flight-record-visibility-key";