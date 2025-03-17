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
  htmlInput: { maxLength: 32, style: { textTransform: 'uppercase' }, onInput: (e) => { e.target.value = e.target.value.toUpperCase() } }
}
export const TIME_SLOT_PROPS = {
  htmlInput: { maxLength: 4, onInput: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, '') } }
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

      // Limit minutes to 59
      if (minutes && parseInt(minutes, 10) > 59) {
        value = `${hours}:59`;
      }

      // Allow clearing or partial input
      e.target.value = value;
    },
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

export const defaultColumnFilterTextFieldProps = ({ column }) => ({
  label: `Filter by ${column.columnDef.header}`,
  placeholder: '',
  InputLabelProps: { shrink: true },
});
