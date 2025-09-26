import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import { getTotalsByMonthAndYear } from "../../../util/helpers";
import TotalsByYearTable from "./TotalsByYearTable";
import useCustomFields from "../../../hooks/useCustomFields";

export const TotalsByYear = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { customFields } = useCustomFields();

  return (
    <TotalsByYearTable
      data={getTotalsByMonthAndYear(data ?? [], customFields ?? [])}
      isLoading={isLoading}
      customFields={customFields ?? []}
    />
  );
}

export default TotalsByYear;