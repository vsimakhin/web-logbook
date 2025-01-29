import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
// Custom components
import Select from "../UIElements/Select"
import { fetchAircraftModels } from "../../util/http/aircraft";

export const AircraftType = ({ gsize, value, handleChange }) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState([])

  const { data } = useQuery({
    queryFn: ({ signal }) => fetchAircraftModels({ signal, navigate }),
    queryKey: ['aircraft-models'],
  })

  useEffect(() => {
    if (data) {
      setOptions(data);
    }
  }, [data])

  return (
    <Select gsize={gsize}
      id="aircraft.model"
      label="Aircraft Type"
      handleChange={handleChange}
      value={value}
      tooltip={"Aircraft type"}
      options={options}
      freeSolo={true}
    />
  );
}

export default AircraftType;