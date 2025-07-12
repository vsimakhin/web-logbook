import { useMemo, useCallback } from 'react';
import { MRT_TableHeadCellFilterContainer } from 'material-react-table';
// MUI
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
// Custom
import TextField from './TextField';

const drawerSx = {
  '& .MuiDrawer-paper': {
    marginTop: '64px',
    height: 'calc(100% - 64px)',
  },
};

const containerSx = { width: 350, padding: 2 };

const fieldNames = {
  "date": "Date",
  "departure.place": "Departure Place",
  "departure.time": "Departure Time",
  "arrival.place": "Arrival Place",
  "arrival.time": "Arrival Time",
  "aircraft.model": "Aircraft Type",
  "aircraft.reg_name": "Aircraft Reg",
  "time.total_time": "Total Time",
  "pic_name": "PIC",
  "remarks": "Remarks"
};

const fieldTransforms = [
  { test: (id) => id.includes("landings."), transform: (header) => `${header} Landing` },
  { test: (id) => id.includes("sim."), transform: () => "Sim Type" },
  { test: (id) => id.includes("time."), transform: (header) => `${header} Time` }
];

export const TableFilterDrawer = ({ table, isFilterDrawerOpen, onClose }) => {

  const filteredHeaders = useMemo(() => {
    if (!table || !table.getLeafHeaders) {
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
  }, [table, isFilterDrawerOpen]);

  const renderFilterComponent = useCallback((header) => {
    const column = header.column;
    const filterVariant = column.columnDef.filterVariant;
    const id = column.columnDef.id;

    // If it's a text filter or no specific filter variant, render custom TextField
    if (filterVariant === 'text' || !filterVariant) {
      let fieldName = fieldNames[id] || column.columnDef.header;

      const transform = fieldTransforms.find(t => t.test(id));
      if (transform) {
        fieldName = transform.transform(column.columnDef.header);
      }

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
  }, [table]);

  return (
    <>
      <Drawer anchor="right" open={isFilterDrawerOpen} onClose={onClose} sx={drawerSx}>
        <Box sx={containerSx}>
          {filteredHeaders.length > 0 ? (
            filteredHeaders.map(renderFilterComponent)
          ) : (
            <Box>Loading filters...</Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}

export default TableFilterDrawer;