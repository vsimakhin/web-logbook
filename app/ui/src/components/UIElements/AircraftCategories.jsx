import { useMemo } from "react";
// Custom
import Select from "./Select";
import { useAircraftsQuery, useModelsCategoriesQuery } from "../../hooks/queries";

const EMPTY = [];

const getUniqueCategoriesFromKey = (items, key) => {
  if (!items || !Array.isArray(items)) {
    return EMPTY;
  }

  const set = new Set();
  items.forEach(item => {
    item[key]?.split(",").forEach(c => {
      c = c.trim();
      if (c) set.add(c);
    });
  });
  return Array.from(set).sort();
};

export const AircraftCategories = ({
  gsize,
  id = "category",
  label = "Category",
  tooltip = "Aircraft Category",
  options = "models",
  value,
  handleChange,
  ...props
}) => {

  const { data: modelCategoriesOptions } = useModelsCategoriesQuery({
    select: data => getUniqueCategoriesFromKey(data, "category"),
  })

  const { data: customCategoriesOptions = EMPTY } = useAircraftsQuery({
    select: data => getUniqueCategoriesFromKey(data, "custom_category"),
  });

  const selectOptions = useMemo(() => {
    if (options === "models") return modelCategoriesOptions ?? EMPTY;
    if (options === "custom") return customCategoriesOptions ?? EMPTY;
    if (options === "all")
      return Array.from(new Set([
        ...(modelCategoriesOptions ?? EMPTY),
        ...(customCategoriesOptions ?? EMPTY)
      ])).sort();
    return EMPTY;
  }, [options, modelCategoriesOptions, customCategoriesOptions]);

  return (
    <Select gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value}
      tooltip={tooltip}
      options={selectOptions}
      multiple
      freeSolo={true}
      {...props}
    />
  );
}

export default AircraftCategories;