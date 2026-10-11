import FlightTags from "../../UIElements/FlightTags";
import { updateNested } from "../helpers";

export const TagCell = ({ params, callBackFunction }) => {
  const handleChange = (key, value) => {
    const updatedRow = updateNested(params.row, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <FlightTags
      value={params.value ? params.value.split(",") : []}
      handleChange={handleChange}
      variant="standard"
      renderInputProps={{ variant: "standard", slotProps: { input: { disableUnderline: true } } }}
      label=""
      tooltip=""
      disableGrid
    />
  )
}

export default TagCell;