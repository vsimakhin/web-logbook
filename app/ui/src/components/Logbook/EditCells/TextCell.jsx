import TextField from "../../UIElements/TextField";
import { updateNested } from "../helpers";

export const TextCell = ({ params, callBackFunction, id }) => {
  const handleChange = (key, value) => {
    const updatedRow = updateNested(params.row, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <TextField
      id={id || params.field}
      value={params.value ?? ""}
      handleChange={handleChange}
      variant="standard"
      slotProps={{ input: { disableUnderline: true } }}
      disableGrid
    />
  );
}

export default TextCell;