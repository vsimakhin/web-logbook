import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { fetchLicenses } from "../../util/http/licensing";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import LisencingTable from "./LicensingTable";

export const Licensing = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['licensing'],
    queryFn: ({ signal }) => fetchLicenses({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load aircrafts list' });

  const columns = useMemo(() => [
    { accessorKey: "category", header: "Category" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "number", header: "Number" },
    { accessorKey: "issued", header: "Issued" },
    { accessorKey: "valid_from", header: "Valid From" },
    { accessorKey: "valid_until", header: "Valid Until" },
    { accessorKey: "remarks", header: "Remarks" },
  ], []);

  return (
    <>
      {isLoading && <LinearProgress />}
      <LisencingTable columns={columns} data={data} isLoading={isLoading} />
    </>
  )
}

export default Licensing;