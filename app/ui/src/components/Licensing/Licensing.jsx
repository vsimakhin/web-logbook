import { useQuery } from "@tanstack/react-query";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { fetchLicenses } from "../../util/http/licensing";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import LisencingTable from "./LicensingTable";
import XLicensingTable from "./XLicensingTable";

export const Licensing = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['licensing'],
    queryFn: ({ signal }) => fetchLicenses({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load licenses' });

  return (
    <>
      {isLoading && <LinearProgress />}
      <XLicensingTable data={data} isLoading={isLoading} />
      <LisencingTable data={data} isLoading={isLoading} />
    </>
  )
}

export default Licensing;