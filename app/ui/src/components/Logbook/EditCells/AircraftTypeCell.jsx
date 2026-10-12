import AircraftType from "../../UIElements/AircraftType";
import { updateNested } from "../helpers";

export const AircraftTypeCell = ({ params, callBackFunction }) => {
  const handleChange = (key, value) => {
    const updatedRow = updateNested(params.row, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <AircraftType
      value={params.value}
      handleChange={handleChange}
      variant="standard"
      renderInputProps={{ variant: "standard", slotProps: { input: { disableUnderline: true } } }}
      label=""
      tooltip=""
      disableGrid
    />
  )
}

export default AircraftTypeCell;