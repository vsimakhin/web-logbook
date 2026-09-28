import { useCallback, useMemo } from "react";
// Custom
import useSettings from "../../hooks/useSettings";
import Select from "../UIElements/Select";
import { useLogbookQuery } from "../../hooks/queries";

const getUniquePicNames = (flights = []) => [
  ...new Set(
    flights
      .map((flight) => flight.pic_name?.trim())
      .filter(Boolean)
  ),
].sort();

export const PICNameField = ({ handleChange, value, gsize, ...props }) => {
  const id = "pic_name";
  const { fieldNameF, settings } = useSettings();
  const { data } = useLogbookQuery();
  const options = useMemo(() => getUniquePicNames(data), [data]);

  const handlePicNameDoubleClick = useCallback(() => {
    handleChange(id, settings.self_pic_label || "Self");
  }, [handleChange, id, settings.self_pic_label]);

  return (
    <Select
      gsize={gsize}
      id={id}
      label={fieldNameF(id)}
      handleChange={handleChange}
      onBlur={(e) => handleChange(id, e.target.value)}
      value={value}
      tooltip={fieldNameF(id)}
      options={options || []}
      freeSolo={true}
      onDoubleClick={handlePicNameDoubleClick}
      {...props}
    />
  )
}