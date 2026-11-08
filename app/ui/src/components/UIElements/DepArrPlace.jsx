import { useCallback, useRef } from 'react';
// MUI Icons
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
// Custom components
import Label from "./Label"
import TextField from "./TextField"
import { PLACE_SLOT_PROPS } from '../../constants/constants';
import useCustomFields from '../../hooks/useCustomFields';

const capitalizeFirstLetter = (str) => str ? `${str[0].toUpperCase()}${str.slice(1)}` : "";

export const DepArrPlace = ({ flight, handleChange, type, label, slotProps: additionalSlotProps = {}, ...props }) => {
  const placeInitialValue = useRef("");
  const handlePlaceFocus = useCallback((event) => { placeInitialValue.current = event.target.value }, []);

  const isDeparture = type === "departure";
  const icon = isDeparture ? FlightTakeoffIcon : FlightLandIcon;

  const { calculateDistance } = useCustomFields();

  const placeValue = isDeparture ? flight.departure?.place : flight.arrival?.place;

  const placeSlotProps = {
    ...PLACE_SLOT_PROPS,
    ...additionalSlotProps,
    input: { ...PLACE_SLOT_PROPS?.input, ...additionalSlotProps?.input },
  };

  const handlePlaceChange = useCallback(async (event) => {
    if (event.target.value === placeInitialValue.current) {
      return;
    }
    // quickly recalculate the distance to show on map
    const distance = await calculateDistance(flight);

    if (distance && flight.track === null) {
      handleChange("distance", distance);
    }
    // it's a trick to update the map when the place field is left
    // otherwise the map will be refreshed on each flight field change
    handleChange("redraw", Math.random());
  }, [flight, handleChange, calculateDistance]);

  return (
    <TextField
      id={`${type}.place`}
      label={(!label || label === "") ? "" : <Label icon={icon} text={label} />}
      handleChange={handleChange}
      value={placeValue}
      slotProps={placeSlotProps}
      tooltip={`${capitalizeFirstLetter(type)} place`}
      onBlur={handlePlaceChange}
      onFocus={handlePlaceFocus}
      {...props}
    />

  )
};

export default DepArrPlace;