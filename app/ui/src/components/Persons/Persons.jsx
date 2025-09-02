import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleFiltersButton,
  MRT_ToggleFullScreenButton,
  MRT_ToggleGlobalFilterButton,
  useMaterialReactTable,
} from "material-react-table";
import { useMemo, useState, useCallback } from "react";
import { useLocalStorageState } from "@toolpad/core/useLocalStorageState";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// MUI
import Box from "@mui/material/Box";
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchPersons } from "../../util/http/person";
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from "../../constants/constants";
import AddPersonButton from "./AddPersonButton";
import EditPersonButton from "./EditPersonButton";
import DeletePersonButton from "./DeletePersonButton";
import ViewPersonButton from "./ViewPersonButton";
import ResetColumnSizingButton from "../UIElements/ResetColumnSizingButton";
import TableFilterDrawer from "../UIElements/TableFilterDrawer";

const paginationKey = "persons-table-page-size";
const columnVisibilityKey = "persons-table-column-visibility";
const columnSizingKey = 'persons-table-column-sizing';

const tableOptions = {
  initialState: { density: "compact" },
  positionToolbarAlertBanner: "bottom",
  groupedColumnMode: "remove",
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnFilters: true,
  enableColumnDragging: false,
  enableColumnPinning: false,
  enableGrouping: false,
  enableDensityToggle: false,
  columnResizeMode: "onEnd",
  muiTablePaperProps: { variant: "outlined", elevation: 0 },
  columnFilterDisplayMode: "custom",
  enableFacetedValues: true,
  enableSorting: true,
  enableColumnActions: true,
  enableRowActions: true,
  displayColumnDefOptions: {
    "mrt-row-actions": {
      size: 120, //if using layoutMode that is not 'semantic', the columns will not auto-size, so you need to set the size manually
      grow: false,
    },
  },
};

export const Persons = () => {
  const navigate = useNavigate();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["persons"],
    queryFn: ({ signal }) => fetchPersons({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to load persons" });

  const columns = useMemo(() => [
    { accessorKey: "first_name", header: "First name" },
    { accessorKey: "middle_name", header: "Middle name" },
    { accessorKey: "last_name", header: "Last name" },
  ], []);

  const filterDrawOpen = useCallback(() => {
    setIsFilterDrawerOpen(true);
  }, []);

  const filterDrawClose = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
      <AddPersonButton />
    </Box>
  ), []);

  const renderRowActions = useCallback(({ row }) => {
    const payload = row.original;
    return (
      <Box>
        <EditPersonButton payload={payload} />
        <DeletePersonButton payload={payload} />
        <ViewPersonButton payload={payload} />
      </Box>
    );
  }, []);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), []);

  const table = useMaterialReactTable({
    isLoading,
    columns: columns,
    data: data ?? [],
    onShowColumnFiltersChange: filterDrawOpen,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    renderRowActions: renderRowActions,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    state: { pagination, columnFilters, columnVisibility, columnSizing },
    defaultColumn: {
      muiFilterTextFieldProps: defaultColumnFilterTextFieldProps,
    },
    renderToolbarInternalActions: renderToolbarInternalActions,
    ...tableOptions,
  });

  return (
    <>
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={filterDrawClose} />
    </>
  );
};

export default Persons;
