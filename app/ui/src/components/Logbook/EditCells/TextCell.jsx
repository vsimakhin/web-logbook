import TextField from "../../UIElements/TextField";

export const TextCell = ({ params, handleCellChange, id }) => {
  return (
    <TextField
      id={id || params.field}
      value={params.value ?? ""}
      handleChange={(key, value) => handleCellChange(params.row, key, value)}
      variant="standard"
      slotProps={{ input: { disableUnderline: true } }}
      disableGrid
    />
  );
}

export default TextCell;