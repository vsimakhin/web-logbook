import { PLACE_SLOT_PROPS } from "../../../constants/constants";
import useCustomFields from "../../../hooks/useCustomFields";
import TextField from "../../UIElements/TextField";
import { updateNested } from "../helpers";

const slotProps = {
  ...PLACE_SLOT_PROPS,
  input: { ...PLACE_SLOT_PROPS?.input, disableUnderline: true },
};

export const EnrouteCell = ({ params, callBackFunction, id }) => {
  const { calculateDistance } = useCustomFields();

  const handleChange = (key, value) => {
    const currentRow = params.api.getRow(params.row.uuid);
    const updatedRow = updateNested(currentRow, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  const enrouteFieldBlur = async () => {
    const currentRow = params.api.getRow(params.row.uuid);
    const distance = await calculateDistance(currentRow);
    handleChange("distance", distance);
  }

  return (
    <TextField
      id={id || params.field}
      value={params.value ?? ""}
      handleChange={handleChange}
      variant="standard"
      slotProps={slotProps}
      onBlur={enrouteFieldBlur}
      disableGrid
    />
  );
}

export default EnrouteCell;