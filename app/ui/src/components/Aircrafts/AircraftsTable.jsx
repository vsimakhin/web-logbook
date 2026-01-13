import { useMemo } from 'react';
import { useDialogs } from '@toolpad/core/useDialogs';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Box from '@mui/material/Box';
// Custom components and libraries
import CSVExportButton from '../UIElements/CSVExportButton';
import EditAircraftModal from './EditAircraftModal';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import CardHeader from '../UIElements/CardHeader';

export const AircraftsTable = ({ data, isLoading }) => {
  const dialogs = useDialogs();

  const columns = useMemo(() => {
    return [
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 50,
        renderCell: (params) => (
          <GridActionsCell {...params}>
            <GridActionsCellItem icon={<EditOutlinedIcon />} onClick={async () => await dialogs.open(EditAircraftModal, params.row)} label="Edit Aircraft" />
          </GridActionsCell>
        ),
      },
      {
        field: "reg",
        headerName: "Registration",
        headerAlign: "center",
        width: 120,
      },
      {
        field: "model",
        headerName: "Type",
        headerAlign: "center",
        align: "center",
        width: 90
      },
      {
        field: "category",
        headerName: "Category",
        headerAlign: "center",
        flex: 1
      },
    ];
  }, [dialogs]);

  const customActions = useMemo(() => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <CardHeader
        title="Aircrafts"
        sx={{ p: 0, '& .MuiCardHeader-content': { alignItems: 'center' } }}
      />
      <CSVExportButton rows={data} type="aircrafts" />
    </Box>
  ), [data]);

  return (
    <XDataGrid
      tableId='aircrafts'
      loading={isLoading}
      rows={data}
      columns={columns}
      getRowId={(row) => row.reg}
      showAggregationFooter={false}
      disableColumnMenu
      customActions={customActions}
    />
  )
}

export default AircraftsTable;