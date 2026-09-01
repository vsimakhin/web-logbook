import { useMemo } from 'react';
import { GridActionsCell, useGridApiRef } from '@mui/x-data-grid';
// MUI UI elements
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import SecurityUpdateGoodOutlinedIcon from '@mui/icons-material/SecurityUpdateGoodOutlined';
// Custom components and libraries
import { evaluateCurrency, formatCurrencyValue, timeframeUnitOptions, getCurrencyExpiryForRule, getStatusBarColor, parseSubMetrics } from './helpers';
import { calculateExpiry } from '../Licensing/helpers';
import dayjs from 'dayjs';
import NewCurrencyButton from './NewCurrencyButton';
import EditCurrencyButton from './EditCurrencyButton';
import DeleteCurrencyButton from './DeleteCurrencyButton';
import HelpButton from './HelpButton';
import useSettings from '../../hooks/useSettings';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import TableActionHeader from '../UIElements/TableActionHeader';

const getLabel = (metricValue, metricOptions) => {
  const option = metricOptions.find(opt => opt.value === metricValue);
  return option ? option.label : metricValue;
}

const formatTimeFrame = (timeFrame) => {
  if (!timeFrame) return '—';

  const { unit, value, since } = timeFrame;
  const label = timeframeUnitOptions.find(
    (option) => option.value === unit
  )?.label;

  if (unit === 'all_time') return label;
  if (unit === 'since') return since ? `Since ${since}` : '—';

  return value ? `${value} ${label}` : '—';
};

const MetricCell = ({ row, metricOptions }) => {
  const metricValue = row.metric;
  const mainLabel = getLabel(metricValue, metricOptions);
  const subMetrics = parseSubMetrics(row.sub_metrics);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography>{mainLabel}</Typography>
      {subMetrics.map((sub, i) => {
        const subLabel = getLabel(sub.metric, metricOptions);
        const formattedTarget = formatCurrencyValue(sub.target_value, sub.metric);
        return (
          <Typography key={sub.id || i} variant="caption" color="text.secondary">
            ↳ {subLabel} {sub.comparison} {formattedTarget}
          </Typography>
        );
      })}
    </Box>
  );
}

const ExpireCell = ({ row, currencyResults }) => {
  const { status, expiry } = currencyResults.get(row.uuid) ?? {};
  const today = dayjs().startOf('day');
  const days = dayjs(expiry).startOf('day').diff(today, 'day');

  if (days === null || days === undefined) {
    const isDaysWindow = row?.time_frame?.unit === 'days';
    const isTimeMetric = typeof row?.metric === 'string' && row.metric.startsWith('time');
    if (isDaysWindow && isTimeMetric && status && status.meetsRequirement === false) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" color={'error'}>Expired</Typography>
        </Box>
      );
    }
    return '—';
  }

  const expiryStr = dayjs(expiry).format('DD/MM/YYYY');
  const exp = calculateExpiry(expiryStr);
  if (!exp) return '—';

  const text = exp.diffDays < 0
    ? 'Expired'
    : `${exp.months > 0 ? `${exp.months} month${exp.months === 1 ? '' : 's'} ` : ''}${exp.days} day${exp.days === 1 ? '' : 's'}`;
  // Currency-specific coloring: yellow in the last ~third of the window (≈30 days), red if expired
  const color = exp.diffDays < 0 ? 'error' : (exp.diffDays < 30 ? 'warning' : 'inherit');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
      <Typography variant="body2" color={color}>{text}</Typography>
    </Box>
  );
}

const getPercent = (current, target) => {
  if (target === 0) return current > 0 ? 100 : 0;
  return (current / target) * 100;
};


const StatusCell = ({ row, metricOptions, currencyResults }) => {
  const { status } = currencyResults.get(row.uuid) ?? { status: { current: 0, meetsRequirement: false, subResults: [] } };

  const value = formatCurrencyValue(status.current, row.metric);
  const percent = getPercent(status.current, row.target_value);
  const percentLabel = percent >= 500 ? '(500+%)' : `(${Math.round(percent)}%)`;
  const color = getStatusBarColor(status.meetsRequirement, percent, row.comparison);
  const mainName = getLabel(row.metric, metricOptions);

  const tooltipContent = (
    <>
      <Typography variant="caption" display="block" fontWeight={500}>
        {mainName}: {value} / {formatCurrencyValue(row.target_value, row.metric)} ({Math.round(percent)}%) {status.mainMeets ? '✓' : '✗'}
      </Typography>
      {status.subResults?.map((sub, i) => {
        const subName = getLabel(sub.metric, metricOptions);
        const subVal = formatCurrencyValue(sub.current, sub.metric);
        const subTarget = formatCurrencyValue(sub.target_value, sub.metric);
        return (
          <Typography key={i} variant="caption" display="block">
            ↳ {subName}: {subVal} / {subTarget} ({Math.round(sub.percent)}%) {sub.meetsRequirement ? '✓' : '✗'}
          </Typography>
        );
      })}
    </>
  );

  const progressBar = (
    <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', height: '100%' }}>
      <LinearProgress sx={{ height: 20, borderRadius: 0, width: '100%' }}
        variant="determinate"
        value={Math.min(100, Math.max(0, percent))}
        color={color}
      />
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" fontWeight={500}>
          {value} {percentLabel}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} disableInteractive>
      {progressBar}
    </Tooltip>
  );
}

export const CurrencyTable = ({ logbookData, currencyData, aircrafts }) => {
  const apiRef = useGridApiRef();
  const { fieldNameF } = useSettings();

  const metricOptions = useMemo(() => (
    [
      { value: "time.total_time", label: fieldNameF("total") },
      { value: "time.se_time", label: fieldNameF("se") },
      { value: "time.me_time", label: fieldNameF("me") },
      { value: "time.mcc_time", label: fieldNameF("mcc") },
      { value: "time.night_time", label: fieldNameF("night") },
      { value: "time.ifr_time", label: fieldNameF("ifr") },
      { value: "time.pic_time", label: fieldNameF("pic") },
      { value: "time.co_pilot_time", label: fieldNameF("cop") },
      { value: "time.dual_time", label: fieldNameF("dual") },
      { value: "time.instructor_time", label: fieldNameF("instr") },
      { value: "time.cc_time", label: fieldNameF("cc") },
      { value: "landings.all", label: fieldNameF("landings") },
      { value: "landings.day", label: `${fieldNameF("land_day")} ${fieldNameF("landings")}` },
      { value: "landings.night", label: `${fieldNameF("land_night")} ${fieldNameF("landings")}` },
      { value: "sim.time", label: `${fieldNameF("fstd")} ${fieldNameF("sim_time")}` },
    ]
  ), [fieldNameF]);

  const currencyResults = useMemo(() => {
    if (!currencyData || !logbookData) return new Map();
    return new Map(
      currencyData.map((row) => {
        const status = evaluateCurrency(logbookData, row, aircrafts);
        const expiry = getCurrencyExpiryForRule(logbookData, row, aircrafts);

        return [row.uuid, { status, expiry }];
      })
    );
  }, [currencyData, logbookData, aircrafts]);

  const columns = useMemo(() => (
    [
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 50,
        renderHeader: () => <TableActionHeader />,
        renderCell: (params) => (
          <GridActionsCell {...params} suppressChildrenValidation>
            <EditCurrencyButton params={params} showInMenu />
            <DeleteCurrencyButton params={params} showInMenu />
          </GridActionsCell>
        ),
      },
      { field: "name", headerName: "Name", headerAlign: 'center', width: 200 },
      {
        field: "metric",
        headerName: "Metric",
        headerAlign: 'center',
        width: 200,
        renderCell: ({ row }) => <MetricCell row={row} metricOptions={metricOptions} />
      },
      {
        field: "comparison",
        headerName: "Comparison",
        headerAlign: 'center',
        align: 'center',
        width: 40,
        renderHeader: () => <CalculateOutlinedIcon />,
      },
      { field: "target_value", headerName: "Target", headerAlign: 'center', width: 80 },
      {
        field: "time_frame_combined",
        headerName: "Time Frame",
        headerAlign: 'center',
        width: 170,
        renderCell: ({ row }) => formatTimeFrame(row.time_frame)
      },
      { field: "filters", headerName: "Filters", headerAlign: 'center', width: 150 },
      {
        field: "valid_until",
        headerName: "Valid Until",
        headerAlign: 'center',
        width: 150,
        renderCell: ({ row }) => {
          const { expiry } = currencyResults.get(row.uuid) ?? {};
          return expiry ? dayjs(expiry).format('DD/MM/YYYY') : '—'
        }
      },
      {
        field: "expire",
        headerName: "Expire",
        headerAlign: 'center',
        width: 150,
        renderCell: ({ row }) => <ExpireCell row={row} currencyResults={currencyResults} />
      },
      {
        field: "status",
        headerName: "Status",
        headerAlign: "center",
        width: 220,
        renderCell: ({ row }) => <StatusCell row={row} metricOptions={metricOptions} currencyResults={currencyResults} />
      }
    ]
  ), [metricOptions, currencyResults]);

  const customActions = useMemo(() => (
    <>
      <NewCurrencyButton />
      <HelpButton />
    </>
  ), []);

  return (
    <XDataGrid
      apiRef={apiRef}
      tableId="currency"
      title="Currency"
      icon={<SecurityUpdateGoodOutlinedIcon />}
      rows={currencyData}
      columns={columns}
      getRowId={(row) => row.uuid}
      getRowHeight={(params) => {
        const subMetrics = parseSubMetrics(params.model?.sub_metrics);
        return subMetrics.length > 0 ? Math.max(38, 30 + subMetrics.length * 18) : 26;
      }}
      showAggregationFooter={false}
      disableColumnMenu
      showPageTotal={false}
      customActions={customActions}
    />
  );
}

export default CurrencyTable;