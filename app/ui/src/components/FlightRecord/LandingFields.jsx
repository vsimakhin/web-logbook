import TextField from "../UIElements/TextField";

export const LandingFields = ({ flight, handleChange }) => {

  return (
    <>
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id="landings.day"
        label="Day Landings"
        handleChange={handleChange}
        value={flight.landings.day === 0 ? "" : flight.landings.day ?? ""}
        tooltip="Day landings"
      />
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id="landings.night"
        label="Night Landings"
        handleChange={handleChange}
        value={flight.landings.night === 0 ? "" : flight.landings.night ?? ""}
        tooltip="Night landings"
      />
    </>
  );
}

export default LandingFields;