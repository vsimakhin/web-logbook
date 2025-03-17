import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useCallback, useMemo } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../../constants/constants';
import { convertMinutesToTime } from '../../../util/helpers';
import CSVExportButton from '../../UIElements/CSVExportButton';

const tableOptions = {
  initialState: {
    density: 'compact',
    columnPinning: {
      left: ['model'],
    },
  },
  positionToolbarAlertBanner: 'bottom',
  groupedColumnMode: 'remove',
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnFilters: false,
  enableColumnDragging: false,
  enableColumnPinning: true,
  enableGrouping: true,
  enableDensityToggle: false,
  columnResizeMode: 'onEnd',
  muiTablePaperProps: { variant: 'outlined', elevation: 0 },
  columnFilterDisplayMode: 'custom',
  enableFacetedValues: false,
  enableSorting: true,
  enableColumnActions: true,
  enableStickyHeader: true,
  enablePagination: false,
}

const timeFieldSize = 90;

const renderProps = {
  muiTableBodyCellProps: { align: "center", sx: { p: 0.5 } },
};

const createTimeColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: timeFieldSize,
  ...renderProps,
  Cell: ({ cell }) => (convertMinutesToTime(cell.getValue())),
})

export const TotalsByAircraftTable = ({ data, isLoading, type }) => {
  const paginationKey = `totals-stats-${type}-table-page-size`;
  const columnVisibilityKey = `totals-stats-${type}-table-column-visibility`;

  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });

  const columns = useMemo(() => [
    { accessorKey: "model", header: type === "type" ? "Type" : "Category", size: 100 },
    createTimeColumn("time.se_time", "SE"),
    createTimeColumn("time.me_time", "ME"),
    createTimeColumn("time.mcc_time", "MCC"),
    createTimeColumn("time.night_time", "Night"),
    createTimeColumn("time.ifr_time", "IFR"),
    createTimeColumn("time.pic_time", "PIC"),
    createTimeColumn("time.co_pilot_time", "Co-Pilot"),
    createTimeColumn("time.dual_time", "Dual"),
    createTimeColumn("time.instructor_time", "Instructor"),
    createTimeColumn("time.cc_time", "CC"),
    createTimeColumn("sim.time", "Sim"),
    {
      accessorFn: row => `${row.landings.day}/${row.landings.night}`, header: "D/N", size: 120,
    },
    {
      accessorKey: "distance", header: "Distance", size: 100,
      aggregationFn: "sum",
      Cell: ({ cell }) => (cell.getValue().toLocaleString()),
    },
    createTimeColumn("time.total_time", "Total"),
  ], []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <CSVExportButton table={table} type="totals-by-aircraft" />
    </Box>
  ), []);

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
    state: { pagination, columnVisibility },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    ...tableOptions
  });

  return (
    <>
      {isLoading && <LinearProgress />}
      <MaterialReactTable table={table} />
    </>
  );
}

export default TotalsByAircraftTable;