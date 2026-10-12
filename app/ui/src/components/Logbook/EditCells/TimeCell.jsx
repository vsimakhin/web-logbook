import { TIME_SLOT_PROPS } from "../../../constants/constants";
import TextField from "../../UIElements/TextField";
import { updateNested } from "../helpers";

const slotProps = {
  ...TIME_SLOT_PROPS,
  input: { ...TIME_SLOT_PROPS?.input, disableUnderline: true },
};

export const TimeCell = ({ params, callBackFunction, id }) => {
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
      slotProps={slotProps}
      disableGrid
    />
  );
}

export default TimeCell;