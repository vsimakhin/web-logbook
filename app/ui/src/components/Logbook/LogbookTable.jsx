import {
  MaterialReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton, useMaterialReactTable
} from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
// MUI
import Box from '@mui/material/Box';
// Custom components and libraries
import PDFExportButton from './PDFExportButton';
import NewFlightRecordButton from './NewFlightRecordButton';
import { tableJSONCodec } from '../../constants/constants';
import {
  createColumn, createDateColumn, createLandingColumn, createTimeColumn,
  renderProps, renderTextProps, renderTotalFooter, createCustomFieldColumns,
  createCustomFieldColumnGroup, createHasTrackColumn, getFilterLabel,
  landingFilterFn, timeFilterFn
} from "./helpers";
import { dateFilterFn } from '../../util/helpers';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import TableHeader from '../UIElements/TableHeader';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';
import { fetchCustomFields } from '../../util/http/fields';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import useSettings from '../../hooks/useSettings';

const paginationKey = 'logbook-table-page-size';
const columnVisibilityKey = 'logbook-table-column-visibility';
const columnSizingKey = 'logbook-table-column-sizing';

const tableOptions = {
  initialState: { density: 'compact' },
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnFilters: true,
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

export const LogbookTable = ({ data, isLoading }) => {
  const navigate = useNavigate();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const { isSettingsLoading, fieldName, paginationOptions } = useSettings();

  // Load the list of custom fields
  const { data: customFields, isLoading: isCustomFieldsLoading, isError: isCustomFieldsError, error: customFieldsError } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: ({ signal }) => fetchCustomFields({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError: isCustomFieldsError, error: customFieldsError, fallbackMessage: 'Failed to load custom fields' });

  const filterFns = useMemo(() => ({
    dateFilterFn: dateFilterFn,
    timeFilterFn: timeFilterFn,
    landingFilterFn: landingFilterFn,
  }), []);

  const columns = useMemo(() => {
    if (isCustomFieldsLoading || isSettingsLoading) {
      return [];
    }

    return [
      {
        header: <TableHeader title={"Misc"} />, columns: [
          createHasTrackColumn("has_track", 40),
          createColumn("attachments_count", "Att"),
        ]
      },
      {
        header: <TableHeader title={fieldName("date")} />, ...renderTextProps, columns: [
          createDateColumn("date", "", 90),
        ]
      },
      {
        header: <TableHeader title={fieldName("departure")} />, ...renderProps, columns: [
          createColumn("departure.place", fieldName("dep_place"), 55),
          createColumn("departure.time", fieldName("dep_time"), 50),
          ...createCustomFieldColumns(customFields, fieldName("departure"))
        ]
      },
      {
        header: <TableHeader title={fieldName("arrival")} />, columns: [
          createColumn("arrival.place", fieldName("arr_place"), 55),
          createColumn("arrival.time", fieldName("arr_time"), 50),
          ...createCustomFieldColumns(customFields, fieldName("arrival"))
        ]
      },
      {
        header: <TableHeader title={fieldName("aircraft")} />, columns: [
          createColumn("aircraft.model", fieldName("model"), 80),
          createColumn("aircraft.reg_name", fieldName("reg"), 80, false, renderTotalFooter()),
          ...createCustomFieldColumns(customFields, fieldName("aircraft"))
        ]
      },
      {
        header: <TableHeader title={fieldName("spt")} />,
        columns: [
          createTimeColumn("time.se_time", fieldName("se")),
          createTimeColumn("time.me_time", fieldName("me")),
          ...createCustomFieldColumns(customFields, fieldName("spt"))
        ]
      },
      {
        header: <TableHeader title={fieldName("mcc")} />, columns: [
          createTimeColumn("time.mcc_time", ""),
          ...createCustomFieldColumns(customFields, fieldName("mcc"))
        ]
      },
      {
        header: <TableHeader title={fieldName("total")} />, columns: [
          createTimeColumn("time.total_time", ""),
          ...createCustomFieldColumns(customFields, fieldName("total"))
        ]
      },
      {
        header: <TableHeader title={fieldName("pic_name")} />,
        columns: [
          createColumn("pic_name", "", 150, true)
        ]
      },
      {
        header: <TableHeader title={fieldName("landings")} />, columns: [
          createLandingColumn("landings.day", fieldName("land_day")),
          createLandingColumn("landings.night", fieldName("land_night")),
          ...createCustomFieldColumns(customFields, fieldName("landings"))
        ]
      },
      {
        header: <TableHeader title={fieldName("oct")} />,
        columns: [
          createTimeColumn("time.night_time", fieldName("night")),
          createTimeColumn("time.ifr_time", fieldName("ifr")),
          ...createCustomFieldColumns(customFields, fieldName("oct"))
        ]
      },
      {
        header: <TableHeader title={fieldName("pft")} />,
        columns: [
          createTimeColumn("time.pic_time", fieldName("pic")),
          createTimeColumn("time.co_pilot_time", fieldName("cop")),
          createTimeColumn("time.dual_time", fieldName("dual")),
          createTimeColumn("time.instructor_time", fieldName("instr")),
          ...createCustomFieldColumns(customFields, fieldName("pft"))
        ]
      },
      {
        header: <TableHeader title={fieldName("fstd")} />,
        columns: [
          createColumn("sim.type", fieldName("sim_type"), 70),
          createTimeColumn("sim.time", fieldName("sim_time")),
          ...createCustomFieldColumns(customFields, fieldName("fstd"))
        ]
      },
      ...createCustomFieldColumnGroup(customFields),
      {
        header: <TableHeader title={fieldName("remarks")} />, grow: true, columns: [
          { accessorKey: "remarks", header: "", grow: true, ...renderTextProps },
          ...createCustomFieldColumns(customFields, fieldName("remarks"))
        ]
      }
    ];
  }, [customFields, isCustomFieldsLoading, fieldName, isSettingsLoading, createHasTrackColumn,
    createColumn, createDateColumn, createTimeColumn, createLandingColumn, renderTotalFooter,
    createCustomFieldColumns, createCustomFieldColumnGroup
  ]);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <NewFlightRecordButton />
      <CSVExportButton table={table} type="logbook" />
      <PDFExportButton />
    </Box>
  ), []);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), []);

  const filterDrawOpen = useCallback(() => {
    setIsFilterDrawerOpen(true);
  }, []);

  const filterDrawClose = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  const getMuiFilterTextFieldProps = useCallback(({ column }) => (
    getFilterLabel(column, fieldName)
  ), [fieldName, getFilterLabel]);

  const table = useMaterialReactTable({
    columns: columns,
    data: data ?? [],
    isLoading: isLoading || isSettingsLoading || isCustomFieldsLoading,
    onShowColumnFiltersChange: filterDrawOpen,
    filterFns: filterFns,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
    state: {
      pagination,
      columnFilters: columnFilters,
      columnVisibility,
      columnSizing: columnSizing
    },
    defaultColumn: { muiFilterTextFieldProps: getMuiFilterTextFieldProps },
    renderToolbarInternalActions: renderToolbarInternalActions,
    muiPaginationProps: {
      rowsPerPageOptions: paginationOptions,
    },
    ...tableOptions,
  });

  return (
    <>
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={filterDrawClose} />
    </>
  );
}

export default LogbookTable;