// Custom components
import { memo } from "react";
import Select from "./Select";

export const PersonRole = memo(({ gsize, id = "role", label = "Role", value, handleChange, ...props }) => {

  const options = ['Captain', 'First officer', 'Second officer', 'Flight instructor', 'Examiner', 'Cabin crew'];

  return (
    <Select gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value}
      tooltip={"Role on this flight"}
      options={options}
      freeSolo={true}
      inputValue={value || ''}
      onInputChange={(event, newValue) => {
        handleChange(id, newValue);
      }}
      {...props}
    />
  );
});

export default PersonRole;