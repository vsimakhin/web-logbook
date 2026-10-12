// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import LogbookTable from "./LogbookTable";
import { useLogbookQuery } from "../../hooks/queries";

export const Logbook = () => {
  const { data, isLoading, isError, error } = useLogbookQuery();
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  return (
    <>
      {isLoading && <LinearProgress />}
      <LogbookTable data={data} isLoading={isLoading} />
    </>
  );
}

export default Logbook;