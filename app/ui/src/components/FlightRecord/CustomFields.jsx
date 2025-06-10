import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
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
import { FLIGHT_TIME_SLOT_PROPS, TIME_SLOT_PROPS } from "../../constants/constants";

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
            {data.map((field) => {
              const props = { slotProps: undefined, type: undefined, placeholder: undefined };

              if (field.type === 'time') {
                props.slotProps = TIME_SLOT_PROPS;
                props.placeholder = 'HHMM';
              } else if (field.type === 'number') {
                props.type = 'number';
              }
              else if (field.type === 'duration') {
                props.slotProps = FLIGHT_TIME_SLOT_PROPS;
                props.placeholder = 'HH:MM';
              }

              return (
                <TextField key={field.uuid} gsize={{ xs: field.size_xs, md: field.size_md, lg: field.size_lg }}
                  label={field.name}
                  id={field.uuid}
                  tooltip={field.description}
                  value={flight.custom_fields?.[field.uuid] || ''}
                  handleChange={customFieldsChange}
                  slotProps={props.slotProps}
                  placeholder={props.placeholder}
                  type={props.type}
                />
              );
            })}
          </Grid>
        </CardContent>
      </Card >

    </>

  );
}

export default CustomFields;