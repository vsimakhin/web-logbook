import { Tooltip } from "@mui/material";
import Select from "../UIElements/Select"

export const AircraftType = ({ gsize, value, handleChange }) => {

  return (
    <Tooltip title="Aircraft type">
      <Select gsize={gsize}
        id="aircraft.model"
        label="Airplane Type"
        handleChange={handleChange}
        value={value}
        tooltip={"Aircraft type"}
      />
    </Tooltip>
  );
}

export default AircraftType;