import TimeField from "../../UIElements/TimeField";

export const FlightTimeCell = ({ params, handleCellChange, fieldFormat, id }) => {
  return (
    <TimeField
      id={id || `time.${params.field}`}
      value={params.value}
      handleChange={(key, value) => handleCellChange(params.row, key, value)}
      fieldFormat={fieldFormat}
      variant="standard"
      placeholder=""
    // slotProps={{ input: { disableUnderline: true } }}
    />
  );
}

export default FlightTimeCell;