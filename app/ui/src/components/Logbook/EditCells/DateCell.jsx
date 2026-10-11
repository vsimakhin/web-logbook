import dayjs from "dayjs";
import DatePicker from "../../UIElements/DatePicker";
import { updateNested } from "../helpers";

export const DateCell = ({ params, callBackFunction }) => {
  const handleChange = (key, value) => {
    const updatedRow = updateNested(params.row, key.split("."), value);
    params.api.updateRows([updatedRow]);
    callBackFunction(params.row.uuid);
  };

  return (
    <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 3, xl: 3 }}
      id="date"
      handleChange={handleChange}
      label=""
      value={params.value ? dayjs(params.value) : dayjs()}
      disableGrid
      tooltip=""
      fieldSlotProps={{ variant: "standard" }}
    />
  );
}

export default DateCell;