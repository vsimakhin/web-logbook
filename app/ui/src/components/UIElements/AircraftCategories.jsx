import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
// Custom
import Select from "./Select";
import { fetchAircraftModelsCategories, fetchAircrafts } from "../../util/http/aircraft";

const getUniqueCategoriesFromKey = (items, key) => {
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
  const navigate = useNavigate();

  const { data: modelCategoriesOptions = [] } = useQuery({
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal, navigate }),
    queryKey: ['models-categories'],
    staleTime: 3600000,
    gcTime: 3600000,
    select: data => getUniqueCategoriesFromKey(data, "category"),
  })

  const { data: customCategoriesOptions = [] } = useQuery({
    queryKey: ['aircrafts'],
    queryFn: ({ signal }) => fetchAircrafts({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    select: data => getUniqueCategoriesFromKey(data, "custom_category"),
  });

  const selectOptions = useMemo(() => {
    if (options === "models") return modelCategoriesOptions ?? [];
    if (options === "custom") return customCategoriesOptions ?? [];
    if (options === "all")
      return Array.from(new Set([
        ...(modelCategoriesOptions ?? []),
        ...(customCategoriesOptions ?? [])
      ])).sort();
    return [];
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