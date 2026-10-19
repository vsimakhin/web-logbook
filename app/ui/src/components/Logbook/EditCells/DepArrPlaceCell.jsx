import DepArrPlace from "../../UIElements/DepArrPlace";
import { updateNested } from "../helpers";

export const DepArrPlaceCell = ({ params, callBackFunction, type }) => {
  const handleChange = (key, value) => {
    const currentRow = params.api.getRow(params.row.uuid);
    const updatedRow = updateNested(currentRow, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <DepArrPlace
      flight={params.row}
      type={type}
      handleChange={handleChange}
      variant="standard"
      slotProps={{ input: { disableUnderline: true } }}
      label=""
    />
  )
}

export default DepArrPlaceCell;