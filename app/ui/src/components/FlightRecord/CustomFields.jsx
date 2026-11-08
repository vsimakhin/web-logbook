import { useCallback } from "react";
// Custom
import TextField from "../UIElements/TextField";
import { TIME_SLOT_PROPS, PLACE_SLOT_PROPS } from "../../constants/constants";
import useCustomFields from "../../hooks/useCustomFields";
import useSettings from "../../hooks/useSettings";
import TimeField from "../UIElements/TimeField";

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
    case 'enroute':
      props.slotProps = PLACE_SLOT_PROPS;
      break;
  }

  return props;
};

export const CustomFields = ({ flight, handleChange }) => {
  const { customFields, calculateDistance } = useCustomFields();
  const { timeFieldsFormat } = useSettings();

  const customFieldsChange = useCallback((key, value) => {
    handleChange(`custom_fields.${key}`, value);
  }, [handleChange]);

  const enrouteFieldChange = useCallback(async () => {
    const distance = await calculateDistance(flight);
    handleChange("distance", distance);
    handleChange("redraw", Math.random());
  }, [handleChange, calculateDistance, flight]);

  return customFields.map((field) => {
    const props = getFieldProps(field.type);

    if (field.type === 'duration') {
      return (
        <div key={field.uuid}>
          <TimeField
            key={field.uuid}
            gsize={null}
            id={field.uuid}
            label={field.name}
            tooltip={field.description}
            value={flight.custom_fields?.[field.uuid] || 0}
            handleChange={customFieldsChange}
            fieldFormat={timeFieldsFormat}
          />
        </div>
      );
    }

    return (
      <div key={field.uuid}>
        <TextField key={field.uuid}
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
      </div>
    );
  })
}

export default CustomFields;