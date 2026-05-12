import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
// Custom
import useSettings from "../../hooks/useSettings";
import { fetchPicNames } from "../../util/http/logbook";
import Select from "../UIElements/Select";

export const PICNameField = ({ handleChange, value, gsize, ...props }) => {
  const id = "pic_name";
  const { fieldNameF, settings } = useSettings();

  const { data: options = [] } = useQuery({
    queryFn: ({ signal }) => fetchPicNames({ signal }),
    queryKey: ['logbook', 'pic-names'],
    staleTime: 3600000,
    gcTime: 3600000,
  })

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