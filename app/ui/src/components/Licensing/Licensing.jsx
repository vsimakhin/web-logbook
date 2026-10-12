// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import LicensingTable from "./LicensingTable";
import { useLicensingQuery } from "../../hooks/queries";

export const Licensing = () => {
  const { data, isLoading, isError, error } = useLicensingQuery();
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load licenses' });

  return (
    <>
      {isLoading && <LinearProgress />}
      <LicensingTable data={data} isLoading={isLoading} />
    </>
  )
}

export default Licensing;