import dayjs from "dayjs";
import DatePicker from "../../UIElements/DatePicker";

export const DateCell = ({ params, handleCellChange }) => {
  return (
    <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 3, xl: 3 }}
      id="date"
      handleChange={(key, value) => handleCellChange(params.row, key, value)}
      label=""
      value={params.value ? dayjs(params.value) : dayjs()}
      disableGrid
      tooltip=""
      fieldSlotProps={{ variant: "standard" }}
    />
  );
}

export default DateCell;