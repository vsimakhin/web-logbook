import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useCallback, useMemo } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../../constants/constants';
import { convertMinutesToTime } from '../../../util/helpers';
import CSVExportButton from '../../UIElements/CSVExportButton';

const paginationKey = 'totals-stats-year-table-page-size';
const columnVisibilityKey = 'totals-stats-year-table-column-visibility';

const tableOptions = {
  initialState: {
    density: 'compact',
    expanded: false,
    grouping: ['year']
  },
  positionToolbarAlertBanner: 'bottom',
  groupedColumnMode: 'remove',
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
  enableFacetedValues: false,
  enableSorting: false,
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
  aggregationFn: "sum",
  AggregatedCell: ({ cell }) => (
    <Typography variant="body2" color="primary" >
      {convertMinutesToTime(cell.getValue())}
    </Typography>
  ),
})

export const TotalsByYearTable = ({ data, isLoading }) => {
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });

  const columns = useMemo(() => [
    { accessorKey: "year", header: "Year", size: 100 },
    {
      accessorKey: "month", header: "Month", size: 100,
      Cell: ({ cell }) => (
        new Date(0, parseInt(cell.getValue()) - 1).toLocaleString('default', { month: 'short' })
      ),
    },
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
      aggregationFn: (columnId, leafRows) => {
        const dayTotal = leafRows.reduce((sum, row) => sum + (parseInt(row.original.landings.day) || 0), 0);
        const nightTotal = leafRows.reduce((sum, row) => sum + (parseInt(row.original.landings.night) || 0), 0);
        return `${dayTotal}/${nightTotal}`;
      },
      AggregatedCell: ({ cell }) => (
        <Typography variant="body2" color="primary">
          {cell.getValue()}
        </Typography>
      ),
    },
    {
      accessorKey: "distance", header: "Distance", size: 100,
      aggregationFn: "sum",
      Cell: ({ cell }) => (cell.getValue().toLocaleString()),
      AggregatedCell: ({ cell }) => (
        <Typography variant="body2" color="primary">
          {cell.getValue().toLocaleString()}
        </Typography>
      ),
    },
    createTimeColumn("time.total_time", "Total"),
  ], []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <CSVExportButton table={table} type="totals-by-year" />
    </Box>
  ), []);

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    displayColumnDefOptions: {
      'mrt-row-expand': { size: 120 }
    },
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

export default TotalsByYearTable;