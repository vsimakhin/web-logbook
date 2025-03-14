// MUI
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
// Custom
import { convertMinutesToTime, convertTimeToMinutes, getValue } from "../../util/helpers";

export const renderTextProps = {
  muiTableBodyCellProps: { align: "left", sx: { p: 0.5 } },
  muiTableHeadCellProps: { align: "center" },
  muiTableFooterCellProps: { align: "center", sx: { p: 0.5 } }
};

export const renderProps = {
  muiTableBodyCellProps: { align: "center", sx: { p: 0.5 } },
  muiTableHeadCellProps: { align: "center" },
  muiTableFooterCellProps: { align: "center", sx: { p: 0.5 } }
};

export const timeFieldSize = 60;

export const renderTotalFooter = () => {
  return (
    <Stack direction="column" spacing={1} >
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>Page:</Typography>
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>Total:</Typography>
    </Stack>
  );
};

const renderTimeFooter = (table, field) => {
  const totalForAllData = table.getPreGroupedRowModel().rows.reduce((total, row) =>
    total + convertTimeToMinutes(getValue(row.original, field)), 0
  );

  const totalForCurrentPage = table.getRowModel().rows.reduce((total, row) =>
    total + convertTimeToMinutes(getValue(row.original, field)), 0
  );
  return (
    <Stack direction="column" spacing={1} alignItems="center" >
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{convertMinutesToTime(totalForCurrentPage)}</Typography>
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{convertMinutesToTime(totalForAllData)}</Typography>
    </Stack>
  );
};

const renderLangingFooter = (table, field) => {
  const totalForAllData = table.getPreGroupedRowModel().rows.reduce((total, row) => {
    const value = parseInt(getValue(row.original, field)) || 0;
    return total + value;
  }, 0);

  const totalForCurrentPage = table.getRowModel().rows.reduce((total, row) => {
    const value = parseInt(getValue(row.original, field)) || 0;
    return total + value;
  }, 0);

  return (
    <Stack direction="column" spacing={1} alignItems="center">
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{totalForCurrentPage}</Typography>
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{totalForAllData}</Typography>
    </Stack>
  );
};

export const renderHeader = (header) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {header.map((item, key) => (<Typography key={key} color="textPrimary" sx={{ fontWeight: 'bold' }}>{item}</Typography>))}
    </Box>
  );
}

export const createTimeColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: timeFieldSize,
  ...renderProps,
  Footer: ({ table }) => renderTimeFooter(table, id),
})

export const createLandingColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: 53,
  ...renderProps,
  Footer: ({ table }) => renderLangingFooter(table, id),
})

export const createDateColumn = (id, name, size) => ({
  accessorKey: id,
  header: name,
  size: size,
  ...renderTextProps,
})

export const createColumn = (id, name, size, isText = false, footer = undefined) => ({
  accessorKey: id,
  header: name,
  size: size,
  ...(isText ? renderTextProps : renderProps),
  Footer: () => footer,
})

export const convertToDDMMYYYY = (date) => {
  if (date === "") {
    return "";
  }

  const parts = date.replace(/[.]/g, '/').split('/');

  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];

  return `${day}/${month}/${year}`;
}

export const autoTimeRecog = (time) => {
  if (!time || time === "") {
    return "";
  }
  return time.replace(/[^0-9]/g, '').padStart(4, '0');
}

export const marshallItem = (item) => {
  return {
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
      co_pilot_time: item.sic_time,
      dual_time: item.dual_time,
      instructor_time: item.instr_time,
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
