import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "../UIElements/Select"
import { fetchLicenseCategory } from "../../util/http/licensing";

export const LicenseCategory = ({ gsize, value, handleChange, id = "category" }) => {
  const { data: options = [] } = useQuery({
    queryFn: ({ signal }) => fetchLicenseCategory({ signal }),
    queryKey: ['licensing-categories'],
  })

  return (
    <Select gsize={gsize}
      id={id}
      label="Category"
      handleChange={handleChange}
      onBlur={(e) => handleChange(id, e.target.value)}
      value={value}
      tooltip="Category"
      options={options}
      freeSolo={true}
    />
  );
}

export default LicenseCategory;