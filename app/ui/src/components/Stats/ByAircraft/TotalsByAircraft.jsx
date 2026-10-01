import { useMemo } from "react";
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { getTotalsByAircraft } from "../../../util/helpers";
import TotalsByAircraftTable from "./TotalsByAircraftTable";
import useCustomFields from "../../../hooks/useCustomFields";
import { useAircraftsQuery, useLogbookQuery, useModelsCategoriesQuery } from "../../../hooks/queries";

export const TotalsByAircraft = ({ type }) => {
  const { data: flights = [], isLoading, isError, error } = useLogbookQuery();
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { data: models = [] } = useModelsCategoriesQuery();
  const { data: aircrafts } = useAircraftsQuery();
  const { customFields } = useCustomFields();

  const totalsData = useMemo(() =>
    getTotalsByAircraft(flights, type, models, aircrafts, customFields),
    [flights, type, models, aircrafts, customFields]
  );

  return (
    <TotalsByAircraftTable
      type={type}
      data={totalsData}
      isLoading={isLoading}
      customFields={customFields ?? []}
    />
  );
}

export default TotalsByAircraft;