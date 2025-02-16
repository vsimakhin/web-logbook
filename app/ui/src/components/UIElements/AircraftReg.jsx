import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "./Select"
import { fetchAircraftRegs } from "../../util/http/aircraft";
import { useEffect, useState } from "react";

export const AircraftReg = ({ gsize, id = "aircraft.reg_name", label = "Registration", value, handleChange, last = true, ...props }) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState([])

  const { data: regs } = useQuery({
    queryFn: ({ signal }) => fetchAircraftRegs({ signal, navigate, last }),
    queryKey: ['aircraft-regs', 'last', last],
  })

  useEffect(() => {
    if (regs) {
      setOptions(Object.keys(regs));
    }
  }, [regs])

  const handleRegChange = (key, value) => {
    handleChange(key, value)

    if (value in regs && id === "aircraft.reg_name") {
      handleChange("aircraft.model", regs[value])
    }
  }

  return (
    <Select gsize={gsize}
      id={id}
      label={label}
      handleChange={handleRegChange}
      value={value}
      tooltip={"Aircraft Registration Number"}
      options={options}
      freeSolo={true}
      {...props}
    />
  );
}

export default AircraftReg;