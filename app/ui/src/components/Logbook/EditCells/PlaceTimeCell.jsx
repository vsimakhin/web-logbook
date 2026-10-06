import PlaceField from "../../FlightRecord/PlaceField";

const fieldNameMock = () => "";

export const PlaceTimeCell = ({ params, handleCellChange, type, placeField = true }) => {
  return (
    <PlaceField
      flight={params.row}
      type={type}
      fieldNameF={fieldNameMock}
      handleChange={(key, value) => handleCellChange(params.row, key, value)}
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