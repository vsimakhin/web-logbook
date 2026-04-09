import { useMemo } from 'react';
import { GridActionsCell, GridActionsCellItem, useGridApiRef } from '@mui/x-data-grid';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FlightOutlinedIcon from '@mui/icons-material/FlightOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import EditCategoriesModal from './EditCategoriesModal';
import CSVExportButton from '../UIElements/CSVExportButton';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import TableActionHeader from '../UIElements/TableActionHeader';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';

export const CategoriesTable = ({ data, isLoading }) => {
  const apiRef = useGridApiRef();
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
            icon={<Tooltip title="Edit Category"><EditOutlinedIcon /></Tooltip>}
            onClick={async () => await dialogs.open(EditCategoriesModal, params.row)}
            label="Edit Category"
          />
        </GridActionsCell>
      ),
    },
    {
      field: "model",
      headerName: "Type",
      headerAlign: "center",
      width: 90,
    },
    {
      field: "category",
      headerName: "Category",
      headerAlign: "center",
      flex: 1
    },
  ], [dialogs]);

  const customActions = useMemo(() => (<CSVExportButton apiRef={apiRef} type="categories" />), [apiRef]);

  return (
    <XDataGrid
      apiRef={apiRef}
      tableId='categories'
      title="Types & Categories"
      icon={<FlightOutlinedIcon />}
      loading={isLoading}
      rows={data}
      columns={columns}
      getRowId={(row) => row.model}
      showAggregationFooter={false}
      disableColumnMenu
      customActions={customActions}
    />
  )
}

export default CategoriesTable;