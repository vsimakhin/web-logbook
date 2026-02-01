import { useQuery } from "@tanstack/react-query";
// MUI
import Grid from "@mui/material/Grid";
// Custom
import AircraftsTable from "./AircraftsTable";
import CategoriesTable from "./CategoriesTable";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchAircraftModelsCategories, fetchAircraftsBuildList } from "../../util/http/aircraft";

export const Aircrafts = () => {
  const { data: aircrafts, isLoading: isLoadingAircrafts, isError: isErrorAircrafts, error: errorAircrafts, isSuccess: isSuccessAircrafts } = useQuery({
    queryKey: ['aircrafts', 'build-list'],
    queryFn: ({ signal }) => fetchAircraftsBuildList({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError: isErrorAircrafts, error: errorAircrafts, fallbackMessage: 'Failed to load aircrafts' });

  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories, error: errorCategories } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    enabled: isSuccessAircrafts, // serialize
  });
  useErrorNotification({ isError: isErrorCategories, error: errorCategories, fallbackMessage: 'Failed to load categories' });

  return (
    <Grid container spacing={1} >
      <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
        <AircraftsTable data={aircrafts} isLoading={isLoadingAircrafts} />
      </Grid>

      <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
        <CategoriesTable data={categories} isLoading={isLoadingCategories} />
      </Grid>
    </Grid>
  );
}

export default Aircrafts;