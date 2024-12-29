// MUI Icons
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
// Custom components
import Label from "../UIElements/Label"
import TextField from "../UIElements/TextField"
import { PLACE_SLOT_PROPS, TIME_SLOT_PROPS } from '../../constants/constants';

const capitalizeFirstLetter = (str) => str ? `${str[0].toUpperCase()}${str.slice(1)}` : "";

export const PlaceField = ({ flight, handleChange, type }) => {
  const icon = type === "departure" ? FlightTakeoffIcon : FlightLandIcon;

  const handlePlaceChange = () => {
    // it's a trick to update the map when the place filed is left
    // otherwise the map will be refreshed on each flight field change
    const map = {
      departure: flight.departure,
      arrival: flight.arrival
    }
    handleChange("map", map);
  }

  return (
    <>
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id={`${type}.place`}
        label={<Label icon={icon} text="Place" />}
        handleChange={handleChange}
        value={type == "departure" ? flight.departure.place : flight.arrival.place ?? ""}
        slotProps={PLACE_SLOT_PROPS}
        tooltip={`${capitalizeFirstLetter(type)} place`}
        onBlur={() => handlePlaceChange()}
      />
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id={`${type}.time`}
        label={<Label icon={icon} text="Time" />}
        handleChange={handleChange}
        value={type == "departure" ? flight.departure.time : flight.arrival.time ?? ""}
        slotProps={TIME_SLOT_PROPS}
        placeholder="HHMM"
        tooltip={`${capitalizeFirstLetter(type)} time`}
      />
    </>
  )
}

export default PlaceField;