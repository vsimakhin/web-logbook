import { useMemo } from 'react';
import { useDialogs } from '@toolpad/core/useDialogs';
import { GridActionsCell, GridActionsCellItem } from '@mui/x-data-grid';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Box from '@mui/material/Box';
// Custom components and libraries
import EditCategoriesModal from './EditCategoriesModal';
import CSVExportButton from '../UIElements/CSVExportButton';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';

export const CategoriesTable = ({ data, isLoading }) => {
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
            <GridActionsCellItem
              icon={<EditOutlinedIcon />}
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
    ];
  }, [dialogs]);

  const customActions = useMemo(() => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <CSVExportButton rows={data} type="categories" />
    </Box>
  ), [data]);

  return (
    <XDataGrid
      tableId='categories'
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