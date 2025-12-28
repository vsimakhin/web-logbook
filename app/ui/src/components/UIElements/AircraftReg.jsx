import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "./Select"
import { fetchAircraftRegs } from "../../util/http/aircraft";
import useSettings from "../../hooks/useSettings";
import { useCallback } from "react";

export const AircraftReg = ({ gsize, id = "aircraft.reg_name", label, value, handleChange, last = true, ...props }) => {
  const { fieldName } = useSettings();

  const { data: regs = {} } = useQuery({
    queryFn: ({ signal }) => fetchAircraftRegs({ signal, last }),
    queryKey: ['aircrafts', 'regs', 'last', last],
    staleTime: 3600000,
    gcTime: 3600000,
  })

  const fieldLabel = label ? label : `${fieldName("aircraft", "flightRecord")} ${fieldName("reg", "flightRecord")}`;
  const options = Object.keys(regs);

  const handleRegChange = useCallback((key, value) => {
    handleChange(key, value)

    if (value in regs && id === "aircraft.reg_name") {
      handleChange("aircraft.model", regs[value])
    }
  }, [handleChange, id, regs]);

  return (
    <Select gsize={gsize}
      id={id}
      label={fieldLabel}
      handleChange={handleRegChange}
      value={value}
      tooltip={fieldLabel}
      options={options}
      onBlur={(e) => handleRegChange(id, e.target.value)}
      freeSolo={true}
      {...props}
    />
  );
}

export default AircraftReg;