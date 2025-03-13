import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
// Custom components and libraries
import { tableJSONCodec } from '../../constants/constants';
import { createColumn, createDateColumn, createLandingColumn, createTimeColumn, renderProps, renderTextProps, renderTotalFooter } from "./helpers";
import OpenCSVButton from './OpenCSVButton';

const paginationKey = 'import-table-page-size';
const columnVisibilityKey = 'import-table-column-visibility';
const tableOptions = {
  initialState: { density: 'compact' },
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnFilters: false,
  enableColumnDragging: false,
  enableColumnPinning: false,
  enableGrouping: true,
  enableDensityToggle: false,
  columnResizeMode: 'onEnd',
  muiTablePaperProps: { variant: 'outlined', elevation: 0 },
  columnFilterDisplayMode: 'custom',
  enableFacetedValues: true,
  enableSorting: false,
  enableColumnActions: false,
};

export const ImportTable = ({ data, isLoading }) => {
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });

  const columns = useMemo(() => [
    {
      header: "Date", ...renderTextProps, columns: [
        createDateColumn("date", "", 90),
      ]
    },
    {
      header: "Departure", ...renderProps, columns: [
        createColumn("departure_place", "Place", 55),
        createColumn("departure_time", "Time", 50)
      ]
    },
    {
      header: "Arrival", columns: [
        createColumn("arrival_place", "Place", 55),
        createColumn("arrival_time", "Time", 50)
      ]
    },
    {
      header: "Aircraft", columns: [
        createColumn("aircraft_model", "Type", 80),
        createColumn("aircraft_reg_name", "Reg", 80, false, renderTotalFooter())
      ]
    },
    {
      header: "Time", columns: [
        createTimeColumn("se_time", "SE"),
        createTimeColumn("me_time", "ME"),
        createTimeColumn("mcc_time", "MCC"),
        createTimeColumn("total_time", "Total"),
        createTimeColumn("night_time", "Night"),
        createTimeColumn("ifr_time", "IFR"),
        createTimeColumn("pic_time", "PIC"),
        createTimeColumn("co_pilot_time", "COP"),
        createTimeColumn("dual_time", "Dual"),
        createTimeColumn("instructor_time", "Instr")
      ]
    },
    {
      header: "Landings", columns: [
        createLandingColumn("landings_day", "Day"),
        createLandingColumn("landings_night", "Night")
      ]
    },
    {
      header: "FSTD Session", columns: [
        createColumn("sim_type", "Type", 70),
        createTimeColumn("sim_time", "Time")
      ]
    },
    {
      header: "PIC Name", columns: [
        createColumn("pic_name", "", 150, true)
      ]
    },
    {
      header: "Remarks", grow: true, columns: [
        { accessorKey: "remarks", header: "", grow: true, ...renderTextProps },
      ]
    }
  ], []);

  const table = useMaterialReactTable({
    columns: columns,
    data: data ?? [],
    isLoading: isLoading,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <OpenCSVButton />
      </Box>
    ),
    onPaginationChange: setPagination,
    state: { pagination, columnVisibility },
    defaultColumn: {
      muiFilterTextFieldProps: ({ column }) => (getFilterLabel(column)),
    },
    ...tableOptions,
  });


  return (
    <>
      <MaterialReactTable table={table} />
    </>
  );
}

export default ImportTable;