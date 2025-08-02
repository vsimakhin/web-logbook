import {
  MaterialReactTable, useMaterialReactTable, MRT_ShowHideColumnsButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton
} from 'material-react-table';
import { useCallback, useMemo } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../../constants/constants';
import { convertMinutesToTime, getCustomFieldValue } from '../../../util/helpers';
import CSVExportButton from '../../UIElements/CSVExportButton';
import ResetColumnSizingButton from '../../UIElements/ResetColumnSizingButton';

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

export const TotalsByAircraftTable = ({ data, isLoading, type, customFields = [] }) => {
  const paginationKey = `totals-stats-${type}-table-page-size`;
  const columnVisibilityKey = `totals-stats-${type}-table-column-visibility`;
  const columnSizingKey = `totals-stats-${type}-table-column-sizing`;

  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  // Helper function to create custom field columns
  const createCustomFieldColumn = (field) => {
    const baseColumn = {
      accessorKey: `custom_fields.${field.uuid}`,
      header: field.name,
      size: 120,
      muiTableBodyCellProps: { align: "center", sx: { p: 0.5 } },
      Cell: ({ row }) => {
        const fieldData = row.original.custom_fields?.[field.uuid];
        const value = getCustomFieldValue(fieldData, field);
        return value;
      },
    };

    // Add aggregation for this table (no grouping like in the year table)
    return baseColumn;
  };

  const columns = useMemo(() => {
    const baseColumns = [
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
        accessorFn: row => `${row.landings.day}/${row.landings.night}`, header: "D/N", size: 90,
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
      createTimeColumn("time.total_time", "Total"),
    ];
  }, [type, customFields]);

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
  ), []);

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