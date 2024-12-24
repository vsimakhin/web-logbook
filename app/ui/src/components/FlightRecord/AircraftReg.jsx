import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "../UIElements/Select"
import { fetchAircraftRegs } from "../../util/http/aircraft";
import { useEffect, useState } from "react";

export const AircraftReg = ({ gsize, value, handleChange }) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState([])

  const { data: regs } = useQuery({
    queryFn: ({ signal }) => fetchAircraftRegs({ signal, navigate, last: true }),
    queryKey: ['aircraft-regs', 'last'],
  })

  useEffect(() => {
    if (regs) {
      setOptions(Object.keys(regs));
    }
  }, [regs])

  const handleRegChange = (key, value) => {
    handleChange(key, value)

    if (value in regs) {
      handleChange("aircraft.model", regs[value])
    }
  }

  return (
    <Select gsize={gsize}
      id="aircraft.reg_name"
      label="Registration"
      handleChange={handleRegChange}
      value={value}
      tooltip={"Aircraft Registration Number"}
      options={options}
      freeSolo={true}
    />
  );
}

export default AircraftReg;