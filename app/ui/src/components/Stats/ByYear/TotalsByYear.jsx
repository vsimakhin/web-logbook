import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
// MUI icons
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import { getTotalsByMonthAndYear } from "../../../util/helpers";
import useCustomFields from "../../../hooks/useCustomFields";
import useSettings from '../../../hooks/useSettings';
import XDataGrid from '../../UIElements/XDataGrid/XDataGrid';
import { createStatsColumns } from '../helpers';
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

  const columns = useMemo(() => {
    return [
      {
        field: "month",
        headerName: "Month",
        headerAlign: 'center',
        align: 'center',
        width: 70,
        renderCell: ({ value }) => new Date(0, value - 1).toLocaleString('default', { month: 'short' })
      },
      ...createStatsColumns({ fieldName, customFields })
    ]
  }, [fieldName, customFields]);

  const activeYear = sortedYears[activeTab];
  const customActions = useMemo(() => (<CSVExportButton rows={dataByYear[activeYear]} type="totals-by-year" />), [dataByYear, activeYear]);

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
          title={`Stats by Year ${activeYear}`}
          icon={<CalendarMonthOutlinedIcon />}
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