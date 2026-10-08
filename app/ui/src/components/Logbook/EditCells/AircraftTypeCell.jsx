import AircraftType from "../../UIElements/AircraftType";

export const AircraftTypeCell = ({ params, handleCellChange }) => {
  return (
    <AircraftType
      value={params.value}
      handleChange={(key, value) => handleCellChange(params.row, key, value)}
      variant="standard"
      renderInputProps={{ variant: "standard", slotProps: { input: { disableUnderline: true } } }}
      label=""
      tooltip=""
      disableGrid
    />
  )
}

export default AircraftTypeCell;