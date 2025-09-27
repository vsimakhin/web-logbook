import { useMemo, useCallback } from 'react';
import { MRT_TableHeadCellFilterContainer } from 'material-react-table';
// MUI
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
// Custom
import TextField from './TextField';
import useSettings from '../../hooks/useSettings';

const drawerSx = {
  '& .MuiDrawer-paper': {
    marginTop: '64px',
    height: 'calc(100% - 64px)',
  },
};

const containerSx = { width: 350, padding: 2 };

export const TableFilterDrawer = ({ table, isFilterDrawerOpen, onClose }) => {

  const { isLoading: isSettingsLoading, fieldName } = useSettings();

  const fieldNames = useMemo(() => ({
    "departure.place": `${fieldName("departure")} ${fieldName("dep_place")}`,
    "departure.time": `${fieldName("departure")} ${fieldName("dep_time")}`,
    "arrival.place": `${fieldName("arrival")} ${fieldName("arr_place")}`,
    "arrival.time": `${fieldName("arrival")} ${fieldName("arr_time")}`,
    "aircraft.model": fieldName("model"),
    "aircraft.reg_name": fieldName("reg"),
    "pic_name": fieldName("pic_name"),
    "remarks": fieldName("remarks"),
    "sim.type": `${fieldName("fstd")} ${fieldName("sim_type")}`,
  }), [fieldName]);


  const filteredHeaders = useMemo(() => {
    if (!table || !table.getLeafHeaders || isSettingsLoading) {
      return [];
    }

    try {
      const allHeaders = table.getLeafHeaders();

      if (allHeaders.length === 0) {
        return [];
      }

      const filtered = allHeaders.filter(header => {
        return header.column?.columnDef?.id &&
          !header.id.startsWith('mrt-') &&
          !header.id.startsWith('Expire') &&
          !header.id.startsWith('center_1_');
      });

      return filtered;
    } catch (error) {
      return [];
    }
  }, [table, isSettingsLoading]);

  const renderFilterComponent = useCallback((header) => {
    const column = header.column;
    const filterVariant = column.columnDef.filterVariant;
    const id = column.columnDef.id;

    // If it's a text filter or no specific filter variant, render custom TextField
    if (filterVariant === 'text' || !filterVariant) {
      const fieldName = fieldNames[id] || column.columnDef.header;

      return (
        <Box key={header.id}>
          <TextField
            label={`Filter by ${fieldName}`}
            variant="standard"
            value={column.getFilterValue() ?? ''}
            onChange={(e) => column.setFilterValue(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      );
    }

    return <MRT_TableHeadCellFilterContainer key={header.id} header={header} table={table} in />;
  }, [table, fieldNames]);

  return (
    <Drawer anchor="right" open={isFilterDrawerOpen} onClose={onClose} sx={drawerSx}>
      <Box sx={containerSx}>
        {filteredHeaders.length > 0 ? (
          filteredHeaders.map(renderFilterComponent)
        ) : (
          <Box>Loading filters...</Box>
        )}
      </Box>
    </Drawer>
  );
}

export default TableFilterDrawer;