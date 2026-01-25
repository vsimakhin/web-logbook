import { useMemo } from "react";
import { Link } from "react-router-dom";
// MUI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
// MUI Icons
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
// Custom
import dayjs from "dayjs";
import XDataGrid from "../UIElements/XDataGrid/XDataGrid";
import CSVExportButton from "../UIElements/CSVExportButton";
import { sumTime } from "../Logbook/helpers";

export const PersonsViewFlightsTable = ({ title, data, isLoading }) => {

  const columns = useMemo(() => [
    {
      field: "date",
      headerName: "Date",
      headerAlign: 'center',
      width: 100,
      type: 'date',
      valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
      valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" color="primary">
            <Link to={`/logbook/${params.row.log_uuid}`} style={{ textDecoration: 'none', color: "inherit" }}>
              {params.formattedValue}
            </Link>
          </Typography>
        </Box>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      headerAlign: 'center',
      width: 100,
    },
    {
      field: "departure",
      headerName: "Departure",
      headerAlign: 'center',
      align: 'center',
      width: 80,
      renderHeader: () => <Tooltip title="Departure" disableInteractive><FlightTakeoffIcon fontSize="small" /></Tooltip>
    },
    {
      field: "arrival",
      headerName: "Arrival",
      headerAlign: 'center',
      align: 'center',
      width: 80,
      renderHeader: () => <Tooltip title="Arrival" disableInteractive><FlightLandIcon fontSize="small" /></Tooltip>
    },
    {
      field: "total_time",
      headerName: "Total",
      headerAlign: 'center',
      align: 'center',
      type: 'time',
      aggregationFn: sumTime,
      width: 80,
    },
    {
      field: "aircraft.model",
      headerName: "Type",
      headerAlign: 'center',
      align: 'center',
      width: 80,
      valueGetter: (_value, row) => row.aircraft?.model,
    },
    {
      field: "aircraft.reg_name",
      headerName: "Reg",
      headerAlign: 'center',
      align: 'center',
      width: 100,
      valueGetter: (_value, row) => row.aircraft?.reg_name,
    },
    {
      field: "sim_type",
      headerName: "Sim",
      headerAlign: 'center',
      width: 80,
    },

  ], []);

  const customActions = useMemo(() => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <CSVExportButton rows={data} type="person-flights" />
    </Box>
  ), [data]);

  return (
    <XDataGrid
      tableId='person-flights'
      title={title}
      icon={<AutoStoriesOutlinedIcon />}
      loading={isLoading}
      rows={data}
      columns={columns}
      getRowId={(row) => row.log_uuid}
      showAggregationFooter={true}
      footerFieldIdTotalLabel='date'
      disableColumnMenu
      customActions={customActions}
    />
  )
}

export default PersonsViewFlightsTable;
