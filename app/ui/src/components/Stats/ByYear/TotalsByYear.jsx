import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import { getTotalsByMonthAndYear } from "../../../util/helpers";
import useCustomFields from "../../../hooks/useCustomFields";
import useSettings from '../../../hooks/useSettings';
import XDataGrid from '../../UIElements/XDataGrid/XDataGrid';
import { buildCustomFieldColumns, timeColumn, zeroValueCellClass } from '../helpers';
import CSVExportButton from "../../UIElements/CSVExportButton";

const EMPTY = {};

const useTotalsData = (data) => {
  // Group data by year
  const dataByYear = useMemo(() => {
    if (!data || data.length === 0) return EMPTY;

    const grouped = {};
    data.forEach(item => {
      const year = item.year;
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(item);
    });

    return grouped;
  }, [data]);

  // Sort years in descending order
  const sortedYears = useMemo(() => {
    return Object.keys(dataByYear).sort((a, b) => b - a);
  }, [dataByYear]);

  return { dataByYear, sortedYears };
};

export const TotalsByYear = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { fieldName } = useSettings();
  const { customFields } = useCustomFields();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const totals = useMemo(() => getTotalsByMonthAndYear(data ?? [], customFields ?? []), [data, customFields]);
  const { dataByYear, sortedYears } = useTotalsData(totals);
  const customFieldColumns = useMemo(() => buildCustomFieldColumns(customFields), [customFields]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "month",
        headerName: "Month",
        headerAlign: 'center',
        align: 'center',
        width: 70,
        renderCell: ({ value }) => new Date(0, value - 1).toLocaleString('default', { month: 'short' })
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
  }, [fieldName, customFieldColumns]);

  const activeYear = sortedYears[activeTab];

  const customActions = useMemo(() => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <CSVExportButton rows={dataByYear[activeYear]} type="totals-by-year" />
    </Box>
  ), [dataByYear, activeYear]);

  if (isLoading) return <LinearProgress />;
  if (!sortedYears.length) return <Typography variant="body1">No data available</Typography>;


  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable">
          {sortedYears.map((year) => (
            <Tab key={year} label={year} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ p: (theme) => theme.spacing(1, 0) }}>
        <XDataGrid sx={{ '& .dg-zero': { color: 'text.disabled' } }}
          key={activeYear}
          tableId="totals-year"
          rows={dataByYear[activeYear]}
          columns={columns}
          getRowId={(row) => `${row.year}-${row.month}`}
          showAggregationFooter
          footerFieldIdTotalLabel="month"
          disableColumnMenu
          disableColumnSorting
          showPagination={false}
          showPageTotal={false}
          customActions={customActions}
        />
      </Box>
    </Box>
  );
}

export default TotalsByYear;