import PlaceField from "../../FlightRecord/PlaceField";
import { updateNested } from "../helpers";

const fieldNameMock = () => "";

export const PlaceTimeCell = ({ params, callBackFunction, type, placeField = true }) => {
  const handleChange = (key, value) => {
    const currentRow = params.api.getRow(params.row.uuid);
    const updatedRow = updateNested(currentRow, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <PlaceField
      flight={params.row}
      type={type}
      fieldNameF={fieldNameMock}
      handleChange={handleChange}
      showPlace={placeField}
      showTime={!placeField}
      variant="standard"
      slotProps={{ input: { disableUnderline: true } }}
      disableLabel
      disableGrid
    />
  )
}

export default PlaceTimeCell;