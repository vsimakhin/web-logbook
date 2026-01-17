import { useMemo } from 'react';
import { GridActionsCell } from '@mui/x-data-grid';
// MUI UI elements
import Box from '@mui/material/Box';
// Custom components and libraries
import CSVExportButton from '../UIElements/CSVExportButton';
import EditCustomAirportButton from './EditCustomAirportButton';
import DeleteCustomAirportButton from './DeleteCustomAirportButton';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import AddCustomAirportButton from './AddCustomAirportButton';
import TableActionHeader from '../UIElements/TableActionHeader';

export const CustomAirportsTable = ({ data, isLoading }) => {

  const columns = useMemo(() => [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 50,
      renderHeader: () => <TableActionHeader />,
      renderCell: (params) => (
        <GridActionsCell {...params} suppressChildrenValidation>
          <EditCustomAirportButton params={params} showInMenu />
          <DeleteCustomAirportButton params={params} showInMenu />
        </GridActionsCell>
      ),
    },
    { field: "name", headerName: "Name", headerAlign: "center", flex: 1 },
    { field: "city", headerName: "City", headerAlign: "center", width: 120 },
    { field: "country", headerName: "Country", headerAlign: "center", width: 50, align: "center" },
    { field: "elevation", headerName: "Elevation", headerAlign: "center", width: 70, type: 'number' },
    { field: "lat", headerName: "Lat", headerAlign: "center", width: 70 },
    { field: "lon", headerName: "Lon", headerAlign: "center", width: 70 },
  ], []);

  const customActions = useMemo(() => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <AddCustomAirportButton />
      <CSVExportButton rows={data} type="custom-airports" />
    </Box>
  ), [data]);

  return (
    <XDataGrid
      tableId='custom-airports'
      loading={isLoading}
      rows={data}
      columns={columns}
      getRowId={(row) => row.icao}
      showAggregationFooter={false}
      disableColumnMenu
      customActions={customActions}
    />
  )
}

export default CustomAirportsTable;