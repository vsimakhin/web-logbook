import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import SaveAltOutlinedIcon from '@mui/icons-material/SaveAltOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import GitHubIcon from '@mui/icons-material/GitHub';

export const DRAWER_WIDTH = 200;

export const NAV_ITEMS = [
  { segment: 'logbook', title: 'Logbook', icon: <AutoStoriesOutlinedIcon /> },
  { segment: 'licensing', title: 'Licensing', icon: <ContactPageOutlinedIcon /> },
  { segment: 'map', title: 'Map', icon: <MapOutlinedIcon /> },
  { kind: 'divider' },
  {
    segment: 'stats', title: 'Statistics', icon: <QueryStatsOutlinedIcon />, children: [
      { segment: 'totals', title: 'Totals', icon: <ArrowForwardOutlinedIcon /> },
      { segment: 'ftl', title: 'Limits', icon: <ArrowForwardOutlinedIcon /> },
      { segment: 'currency', title: 'Currency', icon: <ArrowForwardOutlinedIcon /> },
    ],
  },
  { kind: 'divider' },
  { segment: 'export', title: 'Export', icon: <SaveAltOutlinedIcon /> },
  { segment: 'import', title: 'Import', icon: <FileUploadOutlinedIcon /> },
  { kind: 'divider' },
  { segment: 'settings', title: 'Settings', icon: <SettingsIcon /> },
  { kind: 'divider' },
  { segment: 'version', title: 'v3.0.0-alpha', icon: <GitHubIcon /> },
];

export let API_URL = '/api';
if (import.meta.env.MODE === 'development') {
  API_URL = 'http://localhost:4000/api';
}

export const FLIGHT_INITIAL_STATE = {
  uuid: "",
  date: "",
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

export const PLACE_SLOT_PROPS = {
  htmlInput: { maxLength: 4, style: { textTransform: 'uppercase' }, onInput: (e) => { e.target.value = e.target.value.toUpperCase() } }
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