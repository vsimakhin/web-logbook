import {
  MaterialReactTable, MRT_ShowHideColumnsButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton, useMaterialReactTable
} from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import LinearProgress from '@mui/material/LinearProgress';
// Custom components and libraries
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../../constants/constants';
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import ResetColumnSizingButton from '../../UIElements/ResetColumnSizingButton';
import { fetchCustomFields } from '../../../util/http/fields';
import NewCustomFieldButton from './NewCustomFieldButton';
import EditCustomFieldButton from './EditCustomFieldButton';
import DeleteCustomFieldButton from './DeleteCustomFieldButton';

const paginationKey = 'customfields-table-page-size';
const columnVisibilityKey = 'customfields-table-column-visibility';
const columnSizingKey = 'customfields-table-column-sizing';

const tableOptions = {
  initialState: { density: 'compact' },
  positionToolbarAlertBanner: 'bottom',
  groupedColumnMode: 'remove',
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnDragging: false,
  enableColumnPinning: false,
  enableGrouping: true,
  enableDensityToggle: false,
  columnResizeMode: 'onEnd',
  muiTablePaperProps: { variant: 'outlined', elevation: 0 },
  columnFilterDisplayMode: 'custom',
  enableFacetedValues: true,
  enableSorting: true,
  enableColumnActions: true,
}

export const CustomFieldsTable = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const navigate = useNavigate();

  const { data: data, isLoading, isError, error } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: ({ signal }) => fetchCustomFields({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load custom fields' });

  const columns = useMemo(() => [
    {
      id: 'actions',
      header: 'Actions',
      size: 90,
      Cell: ({ row }) => (
        <>
          <EditCustomFieldButton payload={row.original} />
          <DeleteCustomFieldButton payload={row.original} />
        </>
      ),
    },
    { accessorKey: "display_order", header: "Order", size: 100 },
    { accessorKey: "name", header: "Name", size: 150 },
    { accessorKey: "description", header: "Description", size: 200 },
    { accessorKey: "category", header: "Category", size: 150 },
    { accessorKey: "type", header: "Type", size: 100 },
    { accessorKey: "stats_function", header: "Stats Function", size: 150 },
  ], [data]);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <NewCustomFieldButton />
  ), []);

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility, columnSizing: columnSizing },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    renderToolbarInternalActions: renderToolbarInternalActions,
    ...tableOptions
  });

  return (
    <>
      {(isLoading) && <LinearProgress />}
      <MaterialReactTable table={table} />
    </>
  );
}

export default CustomFieldsTable;