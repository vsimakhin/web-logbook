// Custom components
import Select from "./Select";
import useSettings from "../../hooks/useSettings";

export const defaultPersonRoles = ['Captain', 'First officer', 'Second officer', 'Flight instructor', 'Examiner', 'Cabin crew'];

export const PersonRole = ({ gsize, id = "role", label = "Role", value, handleChange, ...props }) => {

  const { settings } = useSettings();

  return (
    <Select gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value}
      tooltip={"Role on this flight"}
      options={settings.person_roles ? settings.person_roles.split(",").map(role => role.trim()) : defaultPersonRoles}
      freeSolo={true}
      inputValue={value || ''}
      onInputChange={(event, newValue) => {
        handleChange(id, newValue);
      }}
      {...props}
    />
  );
};

export default PersonRole;