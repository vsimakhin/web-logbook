import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import { getTotalsByAircraft } from "../../../util/helpers";
import TotalsByAircraftTable from "./TotalsByAircraftTable";
import { fetchAircraftModelsCategories } from "../../../util/http/aircraft";

export const TotalsByAircraft = ({ type }) => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { data: models } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal, navigate }),
  });

  return (
    <>
      <TotalsByAircraftTable type={type} data={getTotalsByAircraft(data ?? [], type, models ?? [])} isLoading={isLoading} />
    </>
  );
}

export default TotalsByAircraft;