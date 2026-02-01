
import { useMemo } from 'react';
import { GridActionsCell } from '@mui/x-data-grid';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
// Custom components and libraries
import NewCustomFieldButton from './NewCustomFieldButton';
import EditCustomFieldButton from './EditCustomFieldButton';
import DeleteCustomFieldButton from './DeleteCustomFieldButton';
import useCustomFields from '../../../hooks/useCustomFields';
import TableActionHeader from '../../UIElements/TableActionHeader';
import XDataGrid from '../../UIElements/XDataGrid/XDataGrid';
import HelpButton from './HelpButton';

export const CustomFieldsTable = () => {
  const { data, isCustomFieldsLoading } = useCustomFields();

  const columns = useMemo(() => [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 50,
      renderHeader: () => <TableActionHeader />,
      renderCell: (params) => (
        <GridActionsCell {...params} suppressChildrenValidation>
          <EditCustomFieldButton params={params} showInMenu />
          <DeleteCustomFieldButton params={params} showInMenu />
        </GridActionsCell>
      ),
    },
    {
      field: "display_order", headerName: "Order", headerAlign: "center", align: "center", width: 50,
      renderHeader: () => (<Tooltip title="Order"><SwapVertOutlinedIcon /></Tooltip>),
    },
    { field: "name", headerName: "Name", headerAlign: "center", flex: 1 },
    { field: "description", headerName: "Description", headerAlign: "center", flex: 1 },
    { field: "category", headerName: "Category", headerAlign: "center", width: 150 },
    { field: "type", headerName: "Type", headerAlign: "center", width: 100 },
    { field: "stats_function", headerName: "Stats Function", headerAlign: "center", width: 120 },
  ], []);

  const customActions = useMemo(() => (
    <>
      <HelpButton />
      <NewCustomFieldButton />
    </>
  ), []);

  return (
    <XDataGrid
      tableId='custom-fields'
      title='Custom Fields'
      icon={<TuneOutlinedIcon />}
      loading={isCustomFieldsLoading}
      rows={data}
      columns={columns}
      getRowId={(row) => row.uuid}
      showAggregationFooter={false}
      disableColumnMenu
      customActions={customActions}
    />
  )
}

export default CustomFieldsTable;