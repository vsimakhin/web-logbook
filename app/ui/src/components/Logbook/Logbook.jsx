import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { fetchLogbookData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import LogbookTable from "./LogbookTable";

export const Logbook = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load aircrafts list' });

  return (
    <>
      {isLoading && <LinearProgress />}
      <LogbookTable data={data} isLoading={isLoading} />
    </>
  );
}

export default Logbook;