import { useMemo } from 'react';
import { useDialogs } from '@toolpad/core/useDialogs';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FlightOutlinedIcon from '@mui/icons-material/FlightOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import CSVExportButton from '../UIElements/CSVExportButton';
import EditAircraftModal from './EditAircraftModal';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import TableActionHeader from '../UIElements/TableActionHeader';

export const AircraftsTable = ({ data, isLoading }) => {
  const dialogs = useDialogs();

  const columns = useMemo(() => [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 50,
      renderHeader: () => <TableActionHeader />,
      renderCell: (params) => (
        <GridActionsCell {...params}>
          <GridActionsCellItem
            icon={<Tooltip title="Edit Aircraft"><EditOutlinedIcon /></Tooltip>}
            onClick={async () => await dialogs.open(EditAircraftModal, params.row)}
            label="Edit Aircraft"
          />
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
  ], [dialogs]);

  const customActions = useMemo(() => (<CSVExportButton rows={data} type="aircrafts" />), [data]);

  return (
    <XDataGrid
      tableId='aircrafts'
      title="Aircrafts"
      icon={<FlightOutlinedIcon />}
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