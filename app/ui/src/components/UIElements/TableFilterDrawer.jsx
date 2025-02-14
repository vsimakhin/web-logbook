import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { MRT_TableHeadCellFilterContainer } from 'material-react-table';

export const TableFilterDrawer = ({ table, isFilterDrawerOpen, onClose }) => {

  return (
    <>
      <Drawer anchor="right" open={isFilterDrawerOpen} onClose={onClose} sx={{
        '& .MuiDrawer-paper': {
          marginTop: '64px',
          height: 'calc(100% - 64px)',
        },
      }}>
        <Box sx={{ width: 350, padding: 2 }}>
          {table.getLeafHeaders().map((header) => {
            if (header.id.startsWith('mrt-') || header.id.startsWith('Expire') || header.id.startsWith('center_1_')) return null;
            return <MRT_TableHeadCellFilterContainer key={header.id} header={header} table={table} in />
          })}
        </Box>
      </Drawer>
    </>
  );
}

export default TableFilterDrawer;