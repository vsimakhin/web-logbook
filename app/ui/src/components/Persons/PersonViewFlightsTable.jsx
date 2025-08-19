import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useMemo, useState, useCallback } from "react";
import { useLocalStorageState } from "@toolpad/core/useLocalStorageState";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import {
  defaultColumnFilterTextFieldProps,
  tableJSONCodec,
} from "../../constants/constants";
import Box from "@mui/material/Box";
import { fetchLogsForPerson } from "../../util/http/person";
import { LinearProgress } from "@mui/material";

const paginationKey = "persons-view-flights-table-page-size";
const columnVisibilityKey = "persons-view-flights-table-column-visibility";

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
      size: 50, //if using layoutMode that is not 'semantic', the columns will not auto-size, so you need to set the size manually
      grow: false,
    },
  },
};

export const PersonsViewFlightsTable = ({ uuid }) => {
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
    queryKey: ["person-view-flights", uuid],
    queryFn: ({ signal }) =>
      fetchLogsForPerson({ signal, personUuid: uuid, navigate }),
  });
  useErrorNotification({
    isError,
    error,
    fallbackMessage: "Failed to load flights",
  });

  const columns = useMemo(
    () => [
      { accessorKey: "date", header: "Date" },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "departure", header: "From" },
      { accessorKey: "arrival", header: "To" },
      { accessorKey: "aircraft.model", header: "Model" },
      { accessorKey: "aircraft.reg_name", header: "Registration" },
      { accessorKey: "sim_type", header: "Sim" },
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
    ({ table }) => <Box sx={{ display: "flex", flexWrap: "wrap" }}></Box>,
    []
  );

  const renderRowActions = useCallback(({ row }) => {
    const payload = row.original;
    return <Box></Box>;
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
      {isLoading && <LinearProgress />}
      <MaterialReactTable table={table} />
    </>
  );
};

export default PersonsViewFlightsTable;
