import { useNavigate, useParams } from "react-router-dom";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import { fetchCustomFields } from "../../util/http/fields";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import TextField from "../UIElements/TextField";

export const CustomFields = ({ flight, handleChange }) => {
  const navigate = useNavigate();

  const { data, isError, error } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: ({ signal }) => fetchCustomFields({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load custom fields' });

  const customFieldsChange = useCallback((key, value) => {
    handleChange(`custom_fields.${key}`, value);
  }, [handleChange]);

  return (
    (data && Object.keys(data).length > 0) &&
    <>
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <CardHeader title="Custom fields" />
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {data.map((field) => (
              <TextField key={field.uuid} gsize={{ xs: field.size_xs, md: field.size_md, lg: field.size_lg }}
                label={field.name}
                id={field.uuid}
                tooltip={field.description}
                value={flight.custom_fields?.[field.uuid] || ''}
                handleChange={customFieldsChange}
              />
            ))}
          </Grid>
        </CardContent>
      </Card >

    </>

  );
}

export default CustomFields;