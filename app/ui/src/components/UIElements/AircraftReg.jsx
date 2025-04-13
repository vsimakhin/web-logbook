import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "./Select"
import { fetchAircraftRegs } from "../../util/http/aircraft";

export const AircraftReg = ({ gsize, id = "aircraft.reg_name", label = "Registration", value, handleChange, last = true, ...props }) => {
  const navigate = useNavigate();

  const { data: regs = {} } = useQuery({
    queryFn: ({ signal }) => fetchAircraftRegs({ signal, navigate, last }),
    queryKey: ['aircraft-regs', 'last', last],
    staleTime: 3600000,
    gcTime: 3600000,
  })

  const options = Object.keys(regs);

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
      onBlur={(e) => handleRegChange(id, e.target.value)}
      freeSolo={true}
      {...props}
    />
  );
}

export default AircraftReg;