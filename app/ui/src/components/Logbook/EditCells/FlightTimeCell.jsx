import TimeField from "../../UIElements/TimeField";
import { updateNested } from "../helpers";

export const FlightTimeCell = ({ params, callBackFunction, fieldFormat, id }) => {
  const handleChange = (key, value) => {
    const updatedRow = updateNested(params.row, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <TimeField
      id={id || `time.${params.field}`}
      value={params.value || 0}
      handleChange={handleChange}
      fieldFormat={fieldFormat}
      variant="standard"
      placeholder=""
    />
  );
}

export default FlightTimeCell;