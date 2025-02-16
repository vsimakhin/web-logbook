import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom
import Select from "./Select";
import { fetchAircraftCategories } from "../../util/http/aircraft";

export const AircraftCategories = ({ gsize, id = "category", label = "Category", value, handleChange, ...props }) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState([])

  const { data: categories } = useQuery({
    queryFn: ({ signal }) => fetchAircraftCategories({ signal, navigate }),
    queryKey: ['aircraft-categories'],
  })

  useEffect(() => {
    if (categories) {
      setOptions(categories);
    }
  }, [categories])

  return (
    <Select gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value}
      tooltip={"Aircraft Category"}
      options={options}
      multiple
      freeSolo={true}
      {...props}
    />
  );
}

export default AircraftCategories;