import TextField from "../../UIElements/TextField";

const NUMBER_SLOT_PROPS = { inputMode: "numeric" };

export const NumberCell = ({ params, handleCellChange, id }) => {
  const targetId = id || params.field;
  const displayValue = params.value === 0 || params.value === null || params.value === undefined ? "" : params.value;

  const handleChange = (key, value) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      handleCellChange(params.row, key, numValue);
    }
  };

  return (
    <TextField
      id={targetId}
      value={displayValue}
      handleChange={handleChange}
      variant="standard"
      slotProps={{ input: { disableUnderline: true }, htmlInput: NUMBER_SLOT_PROPS }}
      disableGrid
    />
  );
};

export default NumberCell;
