import {
  MaterialReactTable, useMaterialReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton,
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
import useSettings from '../../../hooks/useSettings';

const paginationKey = 'totals-stats-year-table-page-size';
const columnVisibilityKey = 'totals-stats-year-table-column-visibility';
const columnSizingKey = 'totals-stats-year-table-column-sizing';

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

export const TotalsByYearTable = ({ data, isLoading, customFields = [] }) => {
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const { fieldName } = useSettings();

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

    // Add aggregation for grouped rows
    if (field.stats_function === 'sum' || field.stats_function === 'average') {
      baseColumn.aggregationFn = (columnId, leafRows) => {
        const totalSum = leafRows.reduce((sum, row) => {
          const fieldData = row.original.custom_fields?.[field.uuid];
          return sum + (fieldData?.sum || 0);
        }, 0);

        if (field.stats_function === 'average') {
          const totalCount = leafRows.reduce((count, row) => {
            const fieldData = row.original.custom_fields?.[field.uuid];
            return count + (fieldData?.count || 0);
          }, 0);
          const average = totalCount > 0 ? totalSum / totalCount : 0;
          return field.type === 'duration' ? convertMinutesToTime(Math.round(average)) : Number(average.toFixed(2));
        }

        return field.type === 'duration' ? convertMinutesToTime(totalSum) : totalSum;
      };
    } else if (field.stats_function === 'count') {
      baseColumn.aggregationFn = (columnId, leafRows) => {
        return leafRows.reduce((count, row) => {
          const fieldData = row.original.custom_fields?.[field.uuid];
          return count + (fieldData?.count || 0);
        }, 0);
      };
    }

    // Add AggregatedCell for grouped display
    baseColumn.AggregatedCell = ({ cell }) => (
      <Typography variant="body2" color="primary">
        {cell.getValue()}
      </Typography>
    );

    return baseColumn;
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: "year", header: "Year", size: 100 },
      {
        accessorKey: "month", header: "Month", size: 100,
        Cell: ({ cell }) => (
          new Date(0, parseInt(cell.getValue()) - 1).toLocaleString('default', { month: 'short' })
        ),
      },
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
        muiTableBodyCellProps: { align: "right", sx: { p: 0.5 } },
      },
      {
        accessorKey: "distance", header: "Distance", size: 100,
        aggregationFn: "sum",
        Cell: ({ cell }) => (cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })),
        AggregatedCell: ({ cell }) => (
          <Typography variant="body2" color="primary">
            {cell.getValue().toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
        ),
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
  }, [customFields]);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <CSVExportButton table={table} type="totals-by-year" />
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
    displayColumnDefOptions: {
      'mrt-row-expand': { size: 120 }
    },
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
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

export default TotalsByYearTable;