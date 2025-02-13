import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom
import Select from "../UIElements/Select";
import { fetchAircraftCategories } from "../../util/http/aircraft";

export const AircraftCategories = ({ gsize, value, handleChange }) => {
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
      id="category"
      label="Category"
      handleChange={handleChange}
      value={value}
      tooltip={"Aircraft Category"}
      options={options}
      multiple
      freeSolo={true}
    />
  );
}

export default AircraftCategories;