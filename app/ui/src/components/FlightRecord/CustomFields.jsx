import { useCallback } from "react";
// MUI UI elements
import Grid from "@mui/material/Grid";
import Divider from '@mui/material/Divider';
// Custom
import TextField from "../UIElements/TextField";
import { FLIGHT_TIME_SLOT_PROPS, TIME_SLOT_PROPS, PLACE_SLOT_PROPS } from "../../constants/constants";
import useLogbook from "../../hooks/useLogbook";
import useCustomFields from "../../hooks/useCustomFields";

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

export const CustomFields = ({ flight, handleChange }) => {
  const { calculateDistance } = useLogbook();
  const { customFields } = useCustomFields();

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
    <>
      <Divider sx={{ mt: 1 }} />
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
    </>
  );
}

export default CustomFields;