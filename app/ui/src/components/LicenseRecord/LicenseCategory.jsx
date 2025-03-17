import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
// Custom components
import Select from "../UIElements/Select"
import { fetchLicenseCategory } from "../../util/http/licensing";


export const LicenseCategory = ({ gsize, value, handleChange }) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState([])

  const { data } = useQuery({
    queryFn: ({ signal }) => fetchLicenseCategory({ signal, navigate }),
    queryKey: ['licensing-categories'],
  })

  useEffect(() => {
    if (data) {
      setOptions(data);
    }
  }, [data])

  return (
    <Select gsize={gsize}
      id="category"
      label="Category"
      handleChange={handleChange}
      value={value}
      tooltip="Category"
      options={options}
      freeSolo={true}
    />
  );
}

export default LicenseCategory;