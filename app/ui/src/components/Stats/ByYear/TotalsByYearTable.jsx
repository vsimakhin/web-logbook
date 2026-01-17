import { useMemo, useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
// Custom
import useSettings from '../../../hooks/useSettings';
import { convertMinutesToTime, getValue } from '../../../util/helpers';
import XDataGrid from '../../UIElements/XDataGrid/XDataGrid';

const useTotalsData = (data) => {
  // Group data by year
  const dataByYear = useMemo(() => {
    if (!data || data.length === 0) return {};

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

const timeColumn = (field, name) => ({
  field: field,
  headerName: name,
  width: 65,
  headerAlign: 'center',
  align: 'center',
  aggregation: 'sum',
  type: 'number',
  aggregationFormatter: (value) => convertMinutesToTime(value),
  valueGetter: (_, row) => getValue(row, field),
  valueFormatter: (value) => convertMinutesToTime(value),
});

export const TotalsTab = ({ data, isLoading, customFields = [] }) => {
  const { dataByYear, sortedYears } = useTotalsData(data);
  const [activeTab, setActiveTab] = useState(0);
  const { fieldName } = useSettings();

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "month",
        headerName: "Month",
        headerAlign: 'center',
        align: 'center',
        width: 70,
        renderCell: (params) => new Date(0, parseInt(params.value) - 1).toLocaleString('default', { month: 'short' })
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
      },
    ];

    const customFieldColumns = customFields
      .filter(field => field.stats_function !== 'none')
      .map(field => {
        const isDuration = field.type === 'duration';
        const isSum = field.stats_function === 'sum';
        const isAvg = field.stats_function === 'average';

        return {
          field: `custom_fields.${field.uuid}`,
          headerName: field.name,
          width: 80,
          headerAlign: 'center',
          align: 'center',
          type: (isDuration && isSum) ? 'time' : 'number',
          aggregation: isAvg ? 'avg' : field.stats_function,
          aggregationFormatter: isDuration ? (value) => convertMinutesToTime(value) : undefined,
          valueGetter: (_, row) => {
            const fieldData = getValue(row, `custom_fields.${field.uuid}`);
            if (!fieldData) return 0;
            if (isSum) return fieldData.sum;
            if (isAvg) return fieldData.count > 0 ? fieldData.sum / fieldData.count : 0;
            if (field.stats_function === 'count') return fieldData.count;
            return 0;
          },
          valueFormatter: (value) => {
            if (isDuration) return convertMinutesToTime(value);
            if (isAvg) return Number(value.toFixed(2));
            return value;
          }
        };
      });

    return [
      ...baseColumns,
      ...customFieldColumns,
      timeColumn("time.total_time", fieldName("total")),
    ];
  }, [fieldName, customFields]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
          {sortedYears.map((year) => (
            <Tab key={year} label={year} />
          ))}
        </Tabs>
      </Box>
      {sortedYears.map((year, index) => (
        <Box key={year} role="tabpanel" hidden={activeTab !== index} sx={{ p: (theme) => theme.spacing(1, 0) }}>
          {activeTab === index && (
            <XDataGrid
              tableId={`totals-year`}
              rows={dataByYear[year]}
              columns={columns}
              getRowId={(row) => row.month}
              showAggregationFooter={true}
              footerFieldIdTotalLabel='month'
              disableColumnMenu
              showPagination={false}
              showPageTotal={false}
              disableColumnSorting
            />
          )}
        </Box>
      ))}
    </Box>
  );
}

