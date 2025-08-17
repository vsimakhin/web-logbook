import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useMemo, useState, useCallback } from "react";
import { useLocalStorageState } from "@toolpad/core/useLocalStorageState";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchPersons } from "../../util/http/person";
import {
  defaultColumnFilterTextFieldProps,
  tableJSONCodec,
} from "../../constants/constants";
import Box from "@mui/material/Box";
import AddPersonButton from "./AddPersonButton";
import EditPersonButton from './EditPersonButton';
import DeletePersonButton from "./DeletePersonButton";

const paginationKey = "persons-table-page-size";
const columnVisibilityKey = "persons-table-column-visibility";

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
};

export const Persons = () => {
  const navigate = useNavigate();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(
    columnVisibilityKey,
    {},
    { codec: tableJSONCodec }
  );
  const [pagination, setPagination] = useLocalStorageState(
    paginationKey,
    { pageIndex: 0, pageSize: 15 },
    { codec: tableJSONCodec }
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["persons"],
    queryFn: ({ signal }) => fetchPersons({ signal, navigate }),
  });

  useErrorNotification({
    isError,
    error,
    fallbackMessage: "Failed to load persons",
  });

  const columns = useMemo(
    () => [
      { accessorKey: "first_name", header: "First name" },
      { accessorKey: "middle_name", header: "Middle name" },
      { accessorKey: "last_name", header: "Last name" },
    ],
    []
  );

  const filterDrawOpen = useCallback(() => {
    setIsFilterDrawerOpen(true);
  }, []);

  const filterDrawClose = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  const renderTopToolbarCustomActions = useCallback(
    ({ table }) => (
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        <AddPersonButton />
      </Box>
    ),
    []
  );

  const renderRowActions = useCallback(({ row }) => {
    const payload = row.original;
    return (
      <>
        <EditPersonButton payload={payload} />
        <DeletePersonButton payload={payload} />
      </>
    );
  }, []);

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
    state: { pagination, columnFilters, columnVisibility },
    defaultColumn: {
      muiFilterTextFieldProps: defaultColumnFilterTextFieldProps,
    },
    ...tableOptions,
  });

  return (
    <>
      <MaterialReactTable table={table} />
    </>
  );
};

export default Persons;
