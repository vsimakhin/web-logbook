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
import { Link } from "react-router-dom";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from "../../constants/constants";
import { fetchLogsForPerson } from "../../util/http/person";
import ResetColumnSizingButton from "../UIElements/ResetColumnSizingButton";
import TableFilterDrawer from "../UIElements/TableFilterDrawer";

const paginationKey = "persons-view-flights-table-page-size";
const columnVisibilityKey = "persons-view-flights-table-column-visibility";
const columnSizingKey = 'persons-view-flights-table-column-sizing';

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
  enableRowActions: false
};

export const PersonsViewFlightsTable = ({ uuid }) => {
  const navigate = useNavigate();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["persons", "flights", uuid],
    queryFn: ({ signal }) => fetchLogsForPerson({ signal, personUuid: uuid, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to load flights" });

  const columns = useMemo(() => [
    {
      accessorKey: "date",
      header: "Date",
      Cell: ({ renderedCellValue, row }) => (
        <Typography variant="body2" color="primary">
          <Link
            to={`/logbook/${row.original.log_uuid}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {renderedCellValue}
          </Link>
        </Typography>
      ),
      size: 100,
    },
    { accessorKey: "role", header: "Role" },
    { accessorKey: "departure", header: "Departure", size: 130 },
    { accessorKey: "arrival", header: "Arrival", size: 130 },
    { accessorKey: "aircraft.model", header: "Type", size: 150 },
    { accessorKey: "aircraft.reg_name", header: "Reg", size: 100 },
    { accessorKey: "sim_type", header: "Sim", size: 150 },
  ], []);

  const filterDrawOpen = useCallback(() => {
    setIsFilterDrawerOpen(true);
  }, []);

  const filterDrawClose = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  const renderTopToolbarCustomActions = useCallback(() => (
    <Box sx={{ display: "flex", flexWrap: "wrap" }}></Box>
  ), []);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), [setColumnSizing]);

  const table = useMaterialReactTable({
    isLoading,
    columns: columns,
    data: data ?? [],
    onShowColumnFiltersChange: filterDrawOpen,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: setPagination,
    state: { pagination, columnFilters, columnVisibility, columnSizing },
    defaultColumn: {
      muiFilterTextFieldProps: defaultColumnFilterTextFieldProps,
    },
    renderToolbarInternalActions: renderToolbarInternalActions,
    ...tableOptions,
  });

  return (
    <>
      {isLoading && <LinearProgress />}
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={filterDrawClose} />
    </>
  );
};

export default PersonsViewFlightsTable;
