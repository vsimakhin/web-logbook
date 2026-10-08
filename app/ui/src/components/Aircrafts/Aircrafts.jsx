// MUI
import Grid from "@mui/material/Grid";
// Custom
import AircraftsTable from "./AircraftsTable";
import CategoriesTable from "./CategoriesTable";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { useAircraftsQuery, useModelsCategoriesQuery } from "../../hooks/queries";

export const Aircrafts = () => {
  const { data: aircrafts, isLoading: isLoadingAircrafts, isError: isErrorAircrafts, error: errorAircrafts } = useAircraftsQuery();
  useErrorNotification({ isError: isErrorAircrafts, error: errorAircrafts, fallbackMessage: 'Failed to load aircrafts' });

  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories, error: errorCategories } = useModelsCategoriesQuery();
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