import { useCallback } from "react";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import TextField from "../UIElements/TextField";
import { FLIGHT_TIME_SLOT_PROPS, TIME_SLOT_PROPS, PLACE_SLOT_PROPS } from "../../constants/constants";
import useLogbook from "../../hooks/useLogbook";

const getFieldProps = (fieldType) => {
  const props = { slotProps: undefined, type: undefined, placeholder: undefined };

  switch (fieldType) {
    case 'time':
      props.slotProps = TIME_SLOT_PROPS;
      props.placeholder = 'HHMM';
      break;
    case 'number':
      props.type = 'number';
      break;
    case 'duration':
      props.slotProps = FLIGHT_TIME_SLOT_PROPS;
      props.placeholder = 'HH:MM';
      break;
    case 'enroute':
      props.slotProps = PLACE_SLOT_PROPS;
      break;
  }

  return props;
};

export const CustomFields = ({ flight, customFields, handleChange }) => {
  const { calculateDistance } = useLogbook();

  const customFieldsChange = useCallback((key, value) => {
    handleChange(`custom_fields.${key}`, value);
  }, [handleChange]);

  const enrouteFieldChange = useCallback(async () => {
    const distance = await calculateDistance(flight);
    handleChange("distance", distance);
    handleChange("redraw", Math.random());
  }, [handleChange, calculateDistance, flight]);

  return (
    (customFields && Object.keys(customFields).length > 0) &&
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Custom fields" />
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {customFields.map((field) => {
            const props = getFieldProps(field.type);

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
                // only for enroute fields we need to recalculate the map data and distance
                onBlur={field.type === 'enroute' ? enrouteFieldChange : undefined}
              />
            );
          })}
        </Grid>
      </CardContent>
    </Card >
  );
}

export default CustomFields;