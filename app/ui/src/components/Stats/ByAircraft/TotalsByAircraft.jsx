import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import { getTotalsByAircraft } from "../../../util/helpers";
import TotalsByAircraftTable from "./TotalsByAircraftTable";
import { fetchAircraftModelsCategories, fetchAircrafts } from "../../../util/http/aircraft";
import useCustomFields from "../../../hooks/useCustomFields";

export const TotalsByAircraft = ({ type }) => {
  const navigate = useNavigate();

  const { data: flights = [], isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { data: models = [] } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });

  const { data: aircrafts = [] } = useQuery({
    queryKey: ['aircrafts'],
    queryFn: ({ signal }) => fetchAircrafts({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  })

  const { customFields } = useCustomFields();

  return (
    <TotalsByAircraftTable
      type={type}
      data={getTotalsByAircraft(flights, type, models, aircrafts, customFields)}
      isLoading={isLoading}
      customFields={customFields ?? []}
    />
  );
}

export default TotalsByAircraft;