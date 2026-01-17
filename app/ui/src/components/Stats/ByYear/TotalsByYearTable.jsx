import { useMemo, useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
// Custom
import useSettings from '../../../hooks/useSettings';
import { convertMinutesToTime, getCustomFieldValue, getValue } from '../../../util/helpers';
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

const sumTimeField = (values) => {
  let totalMinutes = 0;
  values.forEach(v => {
    // if (typeof v === 'string' && v.includes(':')) {
    //   const parts = v.split(':');
    //   if (parts.length === 2) {
    //     const hh = parseInt(parts[0], 10) || 0;
    //     const mm = parseInt(parts[1], 10) || 0;
    //     totalMinutes += (hh * 60) + mm;
    //   }
    // } else if (typeof v === 'number') {
    //   totalMinutes += Math.round(v * 60);
    // }
    totalMinutes += v;
  });

  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${hh}:${mm.toString().padStart(2, '0')}`;
}

export const TotalsTab = ({ data, isLoading, customFields = [] }) => {
  const { dataByYear, sortedYears } = useTotalsData(data);
  const [activeTab, setActiveTab] = useState(0);
  const { fieldName } = useSettings();

  const columns = useMemo(() => {
    const timeColumn = (field, name) => ({
      field: field,
      headerName: name,
      width: 90,
      headerAlign: 'center',
      align: 'center',
      type: 'time',
      aggregationFn: sumTimeField,
      valueGetter: (_, row) => getValue(row, field),
      valueFormatter: (value) => convertMinutesToTime(value),
    });

    const baseColumns = [
      {
        field: "month",
        headerName: "Month",
        width: 90,
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
        field: "landings",
        headerName: `${fieldName("land_day")}/${fieldName("land_night")}`,
        width: 100,
        headerAlign: 'center',
        align: 'center',
        valueGetter: (_, row) => `${row.landings.day}/${row.landings.night}`,
      },
      {
        field: "distance",
        headerName: "Distance",
        width: 100,
        headerAlign: 'right',
        align: 'right',
        valueFormatter: (value) => value ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
      },
    ];

    const customFieldColumns = customFields
      .filter(field => field.stats_function !== 'none')
      .map(field => ({
        field: `custom_fields.${field.uuid}`,
        headerName: field.name,
        width: 120,
        headerAlign: 'center',
        align: 'center',
        valueGetter: (_, row) => {
          const value = getValue(row, `custom_fields.${field.uuid}`);
          return getCustomFieldValue(value, field);
        },
      }));

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
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {sortedYears.map((year) => (
            <Tab key={year} label={year} />
          ))}
        </Tabs>
      </Box>
      {sortedYears.map((year, index) => (
        <Box
          key={year}
          role="tabpanel"
          hidden={activeTab !== index}
          sx={{ p: (theme) => theme.spacing(1, 0) }}
        >
          {activeTab === index && (
            <XDataGrid
              tableId={`totals-year`}
              rows={dataByYear[year]}
              columns={columns}
              getRowId={(row) => row.month}
              showAggregationFooter={true}
              disableColumnMenu
              showPagination={false}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}

