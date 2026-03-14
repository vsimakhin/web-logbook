import { useMemo } from 'react';
import { GridActionsCell, useGridApiRef } from '@mui/x-data-grid';
// MUI Icons
import FlightTakeoffOutlinedIcon from '@mui/icons-material/FlightTakeoffOutlined';
// Custom components and libraries
import CSVExportButton from '../UIElements/CSVExportButton';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import CopyAirportButton from './CopyAirportButton';
import TableActionHeader from '../UIElements/TableActionHeader';

export const StandardAirportsTable = ({ data, isLoading }) => {
  const apiRef = useGridApiRef();

  const columns = useMemo(() => [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 50,
      renderHeader: () => <TableActionHeader />,
      renderCell: (params) => (
        <GridActionsCell {...params} suppressChildrenValidation>
          <CopyAirportButton params={params} />
        </GridActionsCell>
      ),
    },
    { field: "icao", align: "center", headerName: "ICAO", headerAlign: "center", width: 60 },
    { field: "iata", headerName: "IATA", headerAlign: "center", align: "center", width: 60 },
    { field: "name", headerName: "Name", headerAlign: "center", flex: 1 },
    { field: "city", headerName: "City", headerAlign: "center", width: 120 },
    { field: "country", headerName: "Country", headerAlign: "center", width: 50, align: "center" },
    { field: "elevation", headerName: "Elevation", headerAlign: "center", width: 70, type: 'number' },
    { field: "lat", headerName: "Lat", headerAlign: "center", width: 70 },
    { field: "lon", headerName: "Lon", headerAlign: "center", width: 70 },
  ], []);

  const customActions = useMemo(() => (<CSVExportButton apiRef={apiRef} type="airports" />), [apiRef]);

  return (
    <XDataGrid
      apiRef={apiRef}
      tableId='standard-airports'
      title="Standard Airports"
      icon={<FlightTakeoffOutlinedIcon />}
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

export default StandardAirportsTable;