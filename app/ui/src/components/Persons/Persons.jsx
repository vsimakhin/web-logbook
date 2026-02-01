import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GridActionsCell } from "@mui/x-data-grid";
// MUI Icons
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchPersons } from "../../util/http/person";
import AddPersonButton from "./AddPersonButton";
import EditPersonButton from "./EditPersonButton";
import DeletePersonButton from "./DeletePersonButton";
import ViewPersonButton from "./ViewPersonButton";
import XDataGrid from "../UIElements/XDataGrid/XDataGrid";
import TableActionHeader from "../UIElements/TableActionHeader";
import CSVExportButton from "../UIElements/CSVExportButton";

export const Persons = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["persons"],
    queryFn: ({ signal }) => fetchPersons({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to load persons" });

  const columns = useMemo(() => [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 50,
      renderHeader: () => <TableActionHeader />,
      renderCell: (params) => (
        <GridActionsCell {...params} suppressChildrenValidation>
          <ViewPersonButton params={params} showInMenu />
          <EditPersonButton params={params} showInMenu />
          <DeletePersonButton params={params} showInMenu />
        </GridActionsCell>
      ),
    },
    { field: "first_name", headerName: "First name", headerAlign: "center", width: 120 },
    { field: "middle_name", headerName: "Middle name", headerAlign: "center", width: 120 },
    { field: "last_name", headerName: "Last name", headerAlign: "center", width: 120 },
    { field: "phone", headerName: "Phone", headerAlign: "center", width: 160 },
    { field: "email", headerName: "Email", headerAlign: "center", width: 200 },
    { field: "remarks", headerName: "Remarks", headerAlign: "center", flex: 1 },
  ], []);

  const customActions = useMemo(() => (
    <>
      <AddPersonButton />
      <CSVExportButton rows={data} type="persons" />
    </>
  ), [data]);

  return (
    <XDataGrid
      tableId='persons'
      title="Persons"
      icon={<PersonOutlinedIcon />}
      loading={isLoading}
      rows={data}
      columns={columns}
      getRowId={(row) => row.uuid}
      showAggregationFooter={false}
      disableColumnMenu
      customActions={customActions}
    />
  )
}

export default Persons;
