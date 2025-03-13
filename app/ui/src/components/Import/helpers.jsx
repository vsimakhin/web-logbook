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
  const totalForAllData = table.getPreGroupedRowModel().rows.reduce((total, row) => total + getValue(row.original, field), 0);
  const totalForCurrentPage = table.getRowModel().rows.reduce((total, row) => total + getValue(row.original, field), 0);

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
  // Cell: ({ cell, row }) => {
  //   return cell.getValue();
  // },
  Footer: ({ table }) => renderTimeFooter(table, id),
})

export const createLandingColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: 53,
  ...renderProps,
  // Cell: ({ cell }) => (cell.getValue() === 0 ? "" : cell.getValue()),
  Footer: ({ table }) => renderLangingFooter(table, id),
})

export const createDateColumn = (id, name, size) => ({
  accessorKey: id,
  header: name,
  // Cell: ({ renderedCellValue, row }) => (<Typography variant="body2" color="primary">{renderedCellValue}</Typography>),
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
