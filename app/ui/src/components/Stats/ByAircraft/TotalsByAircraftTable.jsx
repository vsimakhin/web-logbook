import { useMemo } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import CSVExportButton from '../../UIElements/CSVExportButton';
import useSettings from '../../../hooks/useSettings';
import XDataGrid from '../../UIElements/XDataGrid/XDataGrid';
import { createStatsColumns } from '../helpers';

export const TotalsByAircraftTable = ({ data, isLoading, type, customFields = [] }) => {
  const { fieldName } = useSettings();

  const columns = useMemo(() => {
    return [
      {
        field: "model",
        headerName: type === "type" ? "Type" : "Category",
        headerAlign: 'center',
        align: 'center',
        width: 100,
      },
      ...createStatsColumns({ fieldName, customFields })
    ]
  }, [type, fieldName, customFields]);

  const customActions = useMemo(() => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <CSVExportButton rows={data} type="totals-by-aircraft" />
    </Box>
  ), [data]);

  if (isLoading) return <LinearProgress />;

  return (
    <XDataGrid sx={{ '& .dg-zero': { color: 'text.disabled' } }}
      tableId={`totals-${type}`}
      rows={data}
      columns={columns}
      getRowId={(row) => `${row.model}`}
      isLoading={isLoading}
      showAggregationFooter={type === "type"}
      footerFieldIdTotalLabel="model"
      disableColumnMenu
      disableColumnSorting
      showPagination={false}
      showPageTotal={false}
      customActions={customActions}
    />
  );
}

export default TotalsByAircraftTable;