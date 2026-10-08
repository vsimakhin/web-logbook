import PICNameField from "../../FlightRecord/PICNameField";

export const PICNameCell = ({ params, handleCellChange }) => {
  return (
    <PICNameField
      value={params.value ?? ""}
      handleChange={(key, value) => handleCellChange(params.row, key, value)}
      renderInputProps={{ variant: "standard", slotProps: { input: { disableUnderline: true } } }}
      label=""
      tooltip=""
      disableGrid
    />
  );
};

export default PICNameCell;
