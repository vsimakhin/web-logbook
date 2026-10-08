import FlightTags from "../../UIElements/FlightTags";

export const TagCell = ({ params, handleCellChange }) => {
  return (
    <FlightTags
      value={params.value ? params.value.split(",") : []}
      handleChange={(key, value) => handleCellChange(params.row, key, value)}
      variant="standard"
      renderInputProps={{ variant: "standard", slotProps: { input: { disableUnderline: true } } }}
      label=""
      tooltip=""
      disableGrid
    />
  )
}

export default TagCell;