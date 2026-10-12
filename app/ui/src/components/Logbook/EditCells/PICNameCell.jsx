import PICNameField from "../../FlightRecord/PICNameField";
import { updateNested } from "../helpers";

export const PICNameCell = ({ params, callBackFunction }) => {
  const handleChange = (key, value) => {
    const updatedRow = updateNested(params.row, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <PICNameField
      value={params.value ?? ""}
      handleChange={handleChange}
      renderInputProps={{ variant: "standard", slotProps: { input: { disableUnderline: true } } }}
      label=""
      tooltip=""
      disableGrid
    />
  );
};

export default PICNameCell;
