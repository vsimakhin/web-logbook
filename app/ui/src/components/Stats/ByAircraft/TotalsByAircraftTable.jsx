import { useMemo } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import CSVExportButton from '../../UIElements/CSVExportButton';
import useSettings from '../../../hooks/useSettings';
import { buildCustomFieldColumns, timeColumn, zeroValueCellClass } from '../helpers';
import XDataGrid from '../../UIElements/XDataGrid/XDataGrid';

export const TotalsByAircraftTable = ({ data, isLoading, type, customFields = [] }) => {
  const { fieldName } = useSettings();

  const customFieldColumns = useMemo(() => buildCustomFieldColumns(customFields), [customFields]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "model",
        headerName: type === "type" ? "Type" : "Category",
        headerAlign: 'center',
        align: 'center',
        width: 100,
      },
      timeColumn("time.se_time", fieldName("se")),
      timeColumn("time.me_time", fieldName("me")),
      timeColumn("time.mcc_time", fieldName("mcc")),
      timeColumn("time.night_time", fieldName("night")),
      timeColumn("time.ifr_time", fieldName("ifr")),
      timeColumn("time.pic_time", fieldName("pic")),
      timeColumn("time.co_pilot_time", fieldName("cop")),
      timeColumn("time.dual_time", fieldName("dual")),
      timeColumn("time.instructor_time", fieldName("instr")),
      timeColumn("time.cc_time", "CC"),
      timeColumn("sim.time", `${fieldName("fstd")} ${fieldName("sim_time")}`),
      {
        field: "land_day",
        headerName: `${fieldName("land_day")} ${fieldName("landings")}`,
        width: 50,
        headerAlign: 'center',
        align: 'center',
        type: 'number',
        aggregation: 'sum',
        valueGetter: (_, row) => (row.landings.day),
        cellClassName: zeroValueCellClass,
      },
      {
        field: "land_night",
        headerName: `${fieldName("land_night")} ${fieldName("landings")}`,
        width: 50,
        headerAlign: 'center',
        align: 'center',
        type: 'number',
        aggregation: 'sum',
        valueGetter: (_, row) => (row.landings.night),
        cellClassName: zeroValueCellClass,
      },
      {
        field: "distance",
        headerName: "Distance",
        width: 100,
        headerAlign: 'center',
        align: 'center',
        type: 'number',
        aggregation: 'sum',
        aggregationFormatter: (value) => value ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
        valueFormatter: (value) => value ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
        cellClassName: zeroValueCellClass,
      },
    ];

    return [
      ...baseColumns,
      ...customFieldColumns,
      timeColumn("time.total_time", fieldName("total")),
    ];
  }, [type, fieldName, customFieldColumns]);

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