import TextField from "../../UIElements/TextField";
import { updateNested } from "../helpers";

const NUMBER_SLOT_PROPS = { inputMode: "numeric" };

export const NumberCell = ({ params, callBackFunction, id }) => {
  const targetId = id || params.field;
  const displayValue = params.value === 0 || params.value === null || params.value === undefined ? "" : params.value;

  const handleChange = (key, value) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      const updatedRow = updateNested(params.row, key.split("."), numValue);
      params.api.updateRows([updatedRow]);
      callBackFunction(params.row.uuid);
    }
  };

  return (
    <TextField
      id={targetId}
      value={displayValue}
      handleChange={handleChange}
      variant="standard"
      slotProps={{ input: { disableUnderline: true }, htmlInput: NUMBER_SLOT_PROPS }}
      disableGrid
    />
  );
};

export default NumberCell;
