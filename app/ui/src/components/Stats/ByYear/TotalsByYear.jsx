import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import { getTotalsByMonthAndYear } from "../../../util/helpers";
import TotalsByYearTable from "./TotalsByYearTable";

export const TotalsByYear = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  return (
    <>
      <TotalsByYearTable data={getTotalsByMonthAndYear(data ?? [])} isLoading={isLoading} />
    </>
  );
}

export default TotalsByYear;