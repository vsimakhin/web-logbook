// Custom components
import Select from "../UIElements/Select"
import { useLicensingQuery } from "../../hooks/queries";
import { useMemo } from "react";

const getUniqueLicenceCategories = (licengins = []) => [
  ...new Set(
    licengins
      .map((license) => license.category?.trim())
      .filter(Boolean)
  ),
].sort();


export const LicenseCategory = ({ gsize, value, handleChange, id = "category" }) => {
  const { data } = useLicensingQuery();
  const options = useMemo(() => getUniqueLicenceCategories(data), [data]);

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