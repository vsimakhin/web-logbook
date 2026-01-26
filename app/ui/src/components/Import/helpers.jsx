export const convertToDDMMYYYY = (date) => {
  if (!date) return "";

  // Normalize separators
  const normalized = date.replace(/[-.]/g, "/");
  const parts = normalized.split("/");

  if (parts.length !== 3) return date; // invalid format, return as is

  let day, month, year;

  // Case: YYYY/MM/DD
  if (parts[0].length === 4) {
    year = parts[0];
    month = parts[1].padStart(2, "0");
    day = parts[2].padStart(2, "0");
  }
  // Case: DD/MM/YYYY
  else if (parts[2].length === 4) {
    day = parts[0].padStart(2, "0");
    month = parts[1].padStart(2, "0");
    year = parts[2];
  }
  // Case: DD/MM/YY
  else if (parts[2].length === 2) {
    day = parts[0].padStart(2, "0");
    month = parts[1].padStart(2, "0");

    const yy = parseInt(parts[2], 10);
    year = yy < 50 ? `20${parts[2]}` : `19${parts[2]}`;
  }
  else {
    // Unknown format, just return original
    return date;
  }

  return `${day}/${month}/${year}`;
}

export const autoTimeRecog = (time) => {
  if (!time) return "";

  // If input looks like a full datetime (has ':')
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const [, h, m] = match;
    return h.padStart(2, "0") + m.padStart(2, "0");
  }

  // Otherwise, just strip non-digits and pad
  return time.replace(/[^0-9]/g, "").padStart(4, "0");
};

export const marshallItem = (item) => {
  return {
    generated_id: item.generated_id,
    uuid: "",
    date: item.date,
    departure: {
      place: item.departure_place,
      time: item.departure_time,
    },
    arrival: {
      place: item.arrival_place,
      time: item.arrival_time,
    },
    aircraft: {
      model: item.aircraft_model,
      reg_name: item.aircraft_reg_name,
    },
    time: {
      se_time: item.se_time,
      me_time: item.me_time,
      mcc_time: item.mcc_time,
      total_time: item.total_time,
      night_time: item.night_time,
      ifr_time: item.ifr_time,
      pic_time: item.pic_time,
      co_pilot_time: item.co_pilot_time,
      dual_time: item.dual_time,
      instructor_time: item.instructor_time,
    },
    landings: {
      day: parseInt(item.landings_day) || 0,
      night: parseInt(item.landings_night) || 0,
    },
    sim: {
      type: item.sim_type,
      time: item.sim_time,
    },
    pic_name: item.pic_name,
    remarks: item.remarks,
  };
}
