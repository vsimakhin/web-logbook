import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "./Select";
import { fetchRoles } from "../../util/http/person";

export const PersonRole = ({ gsize, id = "role", label = "Role", value, handleChange, ...props }) => {

  const { data: options = [] } = useQuery({
    queryKey: ['persons', 'roles'],
    queryFn: ({ signal }) => fetchRoles({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    select: (data) => data || [], // Ensure options is always an array
  });

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
};

export default PersonRole;