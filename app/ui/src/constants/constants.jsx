import dayjs from 'dayjs';

export const DRAWER_WIDTH = 180;
export const MINI_DRAWER_WIDTH = 85;

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
    se_time: 0,
    me_time: 0,
    mcc_time: 0,
    total_time: 0,
    night_time: 0,
    ifr_time: 0,
    pic_time: 0,
    co_pilot_time: 0,
    dual_time: 0,
    instructor_time: 0
  },
  landings: {
    day: 0,
    night: 0
  },
  sim: {
    type: "",
    time: 0
  },
  pic_name: "",
  remarks: "",
  tags: "",
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
  sub_metrics: "",
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