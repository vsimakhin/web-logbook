import AircraftReg from "../../UIElements/AircraftReg";
import { updateNested } from "../helpers";

export const AircraftRegCell = ({ params, callBackFunction, aircraft_model }) => {
  const handleChange = (key, value) => {
    const currentRow = params.api.getRow(params.row.uuid);
    const updatedRow = updateNested(currentRow, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };
  return (
    <AircraftReg
      value={params.value}
      handleChange={handleChange}
      aircraft_model={aircraft_model}
      variant="standard"
      renderInputProps={{ variant: "standard", slotProps: { input: { disableUnderline: true } } }}
      label=""
      tooltip=""
      disableGrid
    />
  );
}

export default AircraftRegCell;