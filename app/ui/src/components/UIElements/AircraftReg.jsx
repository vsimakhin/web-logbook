// Custom components
import Select from "./Select"
import useSettings from "../../hooks/useSettings";
import { useCallback, useMemo } from "react";
import { useLogbookQuery } from "../../hooks/queries";

export const AircraftReg = ({ gsize, id = "aircraft.reg_name", label, value, handleChange, last = true, aircraft_model, ...props }) => {
  const { fieldName } = useSettings();
  const { data = [] } = useLogbookQuery();

  const regs = useMemo(() => {
    const result = data.reduce((acc, flight) => {
      if (flight.aircraft?.reg_name && flight.aircraft?.model) {
        acc[flight.aircraft.reg_name] = flight.aircraft.model;
      }

      return acc;
    }, {});

    if (!last) {
      return Object.fromEntries(Object.entries(result).sort(([regA], [regB]) => regA.localeCompare(regB)));
    }

    return result;
  }, [data, last]);

  const options = useMemo(() => {
    const registrations = Object.keys(regs);

    if (aircraft_model) {
      return registrations.filter((key) => regs[key] === aircraft_model);
    }

    return registrations;
  }, [regs, aircraft_model]);

  const fieldLabel = label || label === "" ? label : `${fieldName("aircraft", "flightRecord")} ${fieldName("reg", "flightRecord")}`;

  const handleRegChange = useCallback((key, value) => {
    handleChange(key, value);

    if (value in regs && id === "aircraft.reg_name") {
      handleChange("aircraft.model", regs[value]);
    }
  }, [handleChange, id, regs]);

  const handleRegBlur = useCallback((e) => {
    if (e.target.value !== value) {
      handleRegChange(id, e.target.value);
    }
  }, [handleRegChange, id, value]);

  return (
    <Select
      gsize={gsize}
      id={id}
      label={fieldLabel}
      handleChange={handleRegChange}
      value={value}
      tooltip={fieldLabel}
      options={options}
      onBlur={handleRegBlur}
      freeSolo={true}
      {...props}
    />
  );
};

export default AircraftReg;