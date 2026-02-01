import { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filterModel, setFilterModel] = useState({ items: [] });

  const updateFilter = useCallback((field, operator, value) => {
    setFilterModel((prev) => {
      const newItems = prev.items.filter(item => !(item.field === field && item.operator === operator));

      if (value !== '' && value !== null && value !== undefined) {
        newItems.push({
          id: `${field}-${operator}`,
          field,
          operator,
          value,
        });
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilterModel({ items: [] });
  }, []);

  return (
    <FilterContext.Provider value={{ filterModel, updateFilter, clearFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
