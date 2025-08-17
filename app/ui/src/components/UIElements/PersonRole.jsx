// Custom components
import Select from "./Select";

export const PersonRole = ({ gsize, id = "role", label = "Role", value, handleChange, ...props }) => {

  const options = ['Captain', 'First officer', 'Second officer', 'Flight instructor', 'Examiner'];

  return (
    <Select gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value}
      tooltip={"Role on this flight"}
      options={options}
      onBlur={(e) => handleChange(id, e.target.value)}
      freeSolo={true}
      {...props}
    />
  );
}

export default PersonRole;