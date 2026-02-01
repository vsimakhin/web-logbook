import { useMemo } from "react";
// MUI
import Grid from "@mui/material/Grid";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../../UIElements/CardHeader";
import Tile from "../../UIElements/Tile";
import { convertMinutesToTime, convertTimeToMinutes } from "../../../util/helpers";

const size = { xs: 6, sm: 3, md: 3, lg: 2, xl: 2 };

const calculateStats = {
  count: (data, uuid) => {
    return data.reduce((acc, item) => {
      const value = item.custom_fields?.[uuid];
      return value ? acc + 1 : acc;
    }, 0);
  },

  sum: (data, uuid, fieldType) => {
    const sum = data.reduce((acc, item) => {
      const value = item.custom_fields?.[uuid];
      if (value) {
        return fieldType === 'duration' ? acc + convertTimeToMinutes(value) : acc + parseFloat(value);
      }
      return acc;
    }, 0);

    return fieldType === 'duration' ? convertMinutesToTime(sum) : sum;
  },

  average: (data, uuid, fieldType) => {
    const { sum, count } = data.reduce((acc, item) => {
      const value = item.custom_fields?.[uuid];
      if (value) {
        const numValue = fieldType === 'duration' ? convertTimeToMinutes(value) : parseFloat(value);
        return {
          sum: acc.sum + numValue,
          count: acc.count + 1
        };
      }
      return acc;
    }, { sum: 0, count: 0 });

    if (count === 0) return 0;

    const average = sum / count;
    return fieldType === 'duration' ? convertMinutesToTime(Math.round(average)) : Number(average.toFixed(2));
  }
};

export const CustomFieldsTiles = ({ data, customFields }) => {
  const visibleFields = useMemo(() => {
    if (!data || data.length === 0 || !customFields?.length) {
      return [];
    }

    return customFields
      .map(field => {
        // Skip fields with 'none' stats function
        if (field.stats_function === 'none') {
          return null;
        }

        const statsCalculator = calculateStats[field.stats_function];
        if (!statsCalculator) {
          return { ...field, stats: null };
        }

        const stats = statsCalculator(data, field.uuid, field.type);
        return { ...field, stats };
      })
      .filter(field => field !== null && field.stats !== null);
  }, [data, customFields]);

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Custom Fields" />
        <Grid container spacing={1}>
          {visibleFields.map((field) => (
            <Tile key={field.uuid} title={field.name} value={field.stats} tooltip={field.description} size={size} />
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CustomFieldsTiles;