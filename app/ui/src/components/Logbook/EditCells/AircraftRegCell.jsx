import AircraftReg from "../../UIElements/AircraftReg";

export const AircraftRegCell = ({ params, handleCellChange, aircraft_model }) => {
  return (
    <AircraftReg
      value={params.value}
      handleChange={(key, value) => handleCellChange(params.row, key, value)}
      aircraft_model={aircraft_model}
      variant="standard"
      renderInputProps={{ variant: "standard", slotProps: { input: { disableUnderline: true } } }}
      label=""
      tooltip=""
      disableGrid
    />
  );
}

export default AircraftRegCell;