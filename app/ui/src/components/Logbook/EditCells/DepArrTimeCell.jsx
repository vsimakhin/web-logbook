import DepArrTime from "../../UIElements/DepArrTime";
import { updateNested } from "../helpers";

export const DepArrTimeCell = ({ params, callBackFunction, type }) => {
  const handleChange = (key, value) => {
    const currentRow = params.api.getRow(params.row.uuid);
    const updatedRow = updateNested(currentRow, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <DepArrTime
      flight={params.row}
      type={type}
      handleChange={handleChange}
      variant="standard"
      slotProps={{ input: { disableUnderline: true } }}
      label=""
    />
  )
}

export default DepArrTimeCell;