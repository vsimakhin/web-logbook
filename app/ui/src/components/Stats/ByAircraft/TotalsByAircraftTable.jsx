import {
  MaterialReactTable, useMaterialReactTable, MRT_ShowHideColumnsButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton
} from 'material-react-table';
import { useCallback, useMemo } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../../constants/constants';
import CSVExportButton from '../../UIElements/CSVExportButton';
import ResetColumnSizingButton from '../../UIElements/ResetColumnSizingButton';
import useSettings from '../../../hooks/useSettings';
import { createCustomFieldColumn, createTimeColumn } from '../helpers';

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
  enableGrouping: false,
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

export const TotalsByAircraftTable = ({ data, isLoading, type, customFields = [] }) => {
  const paginationKey = `totals-stats-${type}-table-page-size`;
  const columnVisibilityKey = `totals-stats-${type}-table-column-visibility`;
  const columnSizingKey = `totals-stats-${type}-table-column-sizing`;

  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const { fieldName } = useSettings();

  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: "model", header: type === "type" ? "Type" : "Category", size: 100 },
      createTimeColumn("time.se_time", fieldName("se")),
      createTimeColumn("time.me_time", fieldName("me")),
      createTimeColumn("time.mcc_time", fieldName("mcc")),
      createTimeColumn("time.night_time", fieldName("night")),
      createTimeColumn("time.ifr_time", fieldName("ifr")),
      createTimeColumn("time.pic_time", fieldName("pic")),
      createTimeColumn("time.co_pilot_time", fieldName("cop")),
      createTimeColumn("time.dual_time", fieldName("dual")),
      createTimeColumn("time.instructor_time", fieldName("instr")),
      createTimeColumn("time.cc_time", "CC"),
      createTimeColumn("sim.time", `${fieldName("fstd")} ${fieldName("sim_time")}`),
      {
        accessorFn: row => `${row.landings.day}/${row.landings.night}`,
        header: `${fieldName("land_day")}/${fieldName("land_night")}`,
        size: 90,
        muiTableBodyCellProps: { align: "right", sx: { p: 0.5 } },
      },
      {
        accessorKey: "distance", header: "Distance", size: 100,
        aggregationFn: "sum",
        Cell: ({ cell }) => (cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })),
        muiTableBodyCellProps: { align: "right", sx: { p: 0.5 } },
      },
    ];

    // Add custom field columns
    const customFieldColumns = customFields
      .filter(field => field.stats_function !== 'none')
      .map(field => createCustomFieldColumn(field));

    return [
      ...baseColumns,
      ...customFieldColumns,
      createTimeColumn("time.total_time", fieldName("total")),
    ];
  }, [type, customFields, fieldName]);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <CSVExportButton table={table} type="totals-by-aircraft" />
    </Box>
  ), []);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), [setColumnSizing]);

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    state: { pagination, columnVisibility, columnSizing },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    renderToolbarInternalActions: renderToolbarInternalActions,
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