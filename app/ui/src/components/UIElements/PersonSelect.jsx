// Custom components
import { useNavigate } from "react-router-dom";
import { fetchPersons } from "../../util/http/person";
import Select from "./Select";
import { useQuery } from "@tanstack/react-query";
import { printPerson } from "../../util/helpers";

export const PersonSelect = ({
  gsize,
  id = "role",
  label = "Role",
  value,
  handleChange,
  ...props
}) => {
  const navigate = useNavigate();

  const { data: persons = [] } = useQuery({
    queryFn: ({ signal }) => fetchPersons({ signal, navigate }),
    queryKey: ["persons"],
    staleTime: 3600000,
    gcTime: 3600000,
  });

  const options = (persons || []).map(p => ({label: printPerson(p), id: p.uuid}));

  return (
    <Select
      gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value}
      tooltip={"Find existing person"}
      options={options}
      freeSolo={false}
      {...props}
    />
  );
};

export default PersonSelect;
