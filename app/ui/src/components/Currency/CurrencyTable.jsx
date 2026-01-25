import { useMemo } from 'react';
import { GridActionsCell } from '@mui/x-data-grid';
// MUI UI elements
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
// MUI Icons
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import SecurityUpdateGoodOutlinedIcon from '@mui/icons-material/SecurityUpdateGoodOutlined';
// Custom components and libraries
import { evaluateCurrency, formatCurrencyValue, timeframeUnitOptions, getCurrencyExpiryForRule } from './helpers';
import { calculateExpiry } from '../Licensing/helpers';
import dayjs from 'dayjs';
import NewCurrencyButton from './NewCurrencyButton';
import EditCurrencyButton from './EditCurrencyButton';
import DeleteCurrencyButton from './DeleteCurrencyButton';
import HelpButton from './HelpButton';
import useSettings from '../../hooks/useSettings';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import TableActionHeader from '../UIElements/TableActionHeader';

export const CurrencyTable = ({ logbookData, currencyData, aircrafts }) => {
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
      { value: "landings.all", label: fieldNameF("landings") },
      { value: "landings.day", label: `${fieldNameF("land_day")} ${fieldNameF("landings")}` },
      { value: "landings.night", label: `${fieldNameF("land_night")} ${fieldNameF("landings")}` },
      { value: "sim.time", label: `${fieldNameF("fstd")} ${fieldNameF("sim_time")}` },
    ]
  ), [fieldNameF]);

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
        width: 150,
        renderCell: (params) => {
          const metricValue = params.row.metric;
          const option = metricOptions.find(opt => opt.value === metricValue);
          return option ? option.label : metricValue;
        }
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
        renderCell: (params) => {
          const cellData = params.row.time_frame;
          const unitOption = timeframeUnitOptions.find(opt => opt.value === cellData.unit);
          const unitLabel = unitOption ? unitOption.label : cellData.unit;

          if (cellData.unit === 'all_time') {
            return unitOption.label;
          } else if (cellData.unit === 'since') {
            return `Since ${cellData.since}`;
          } else if (cellData.value) {
            return `${cellData.value} ${unitLabel}`;
          }
        }
      },
      { field: "filters", headerName: "Filters", headerAlign: 'center', width: 150 },
      {
        field: "valid_until",
        headerName: "Valid Until",
        headerAlign: 'center',
        width: 150,
        renderCell: (params) => {
          const expiry = getCurrencyExpiryForRule(logbookData, params.row, aircrafts);
          return expiry ? dayjs(expiry).format('DD/MM/YYYY') : '—'
        }
      },
      {
        field: "expire",
        headerName: "Expire",
        headerAlign: 'center',
        width: 150,
        renderCell: (params) => {
          const expiry = getCurrencyExpiryForRule(logbookData, params.row, aircrafts);
          const today = dayjs().startOf('day');
          const days = dayjs(expiry).startOf('day').diff(today, 'day');
          const row = params.row;

          if (days === null || days === undefined) {
            // If we can't compute an expiry, still show "Expired" for time-based rules
            // when the rule does not meet the requirement in the current window.
            const res = evaluateCurrency(logbookData, row, aircrafts);

            const isDaysWindow = row?.time_frame?.unit === 'days';
            const isTimeMetric = typeof row?.metric === 'string' && row.metric.startsWith('time');
            if (isDaysWindow && isTimeMetric && res && res.meetsRequirement === false) {
              return (
                <Typography variant="body2" color={'error'}>Expired</Typography>
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
            <Typography variant="body2" color={color}>{text}</Typography>
          );
        }
      },
      {
        field: "status",
        headerName: "Status",
        headerAlign: "center",
        width: 200,
        renderCell: (params) => {
          const status = evaluateCurrency(logbookData, params.row, aircrafts)
          const value = formatCurrencyValue(status?.current, params.row.metric)
          const percent = status.meetsRequirement
            ? 100
            : Math.min(100, (status.current / params.row.target_value) * 100)
          const percentLabel = percent === 100 ? '' : `(${Math.round(percent)}%)`
          const color = status.meetsRequirement ? 'success' : percent > 75 ? 'warning' : 'error'
          return (
            <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', height: '100%' }}>
              <LinearProgress sx={{ height: 20, borderRadius: 0, width: '100%' }}
                variant="determinate"
                value={percent}
                color={color}
              />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" fontWeight={500}>
                  {value} {percentLabel}
                </Typography>
              </Box>
            </Box>
          )
        }
      }
    ]
  ), [metricOptions, logbookData, aircrafts])

  const customActions = useMemo(() => (
    <>
      <NewCurrencyButton />
      <HelpButton />
    </>
  ), []);

  return (
    <XDataGrid
      tableId="currency"
      title="Currency"
      icon={<SecurityUpdateGoodOutlinedIcon />}
      rows={currencyData}
      columns={columns}
      getRowId={(row) => `${row.name}`}
      showAggregationFooter={false}
      disableColumnMenu
      showPageTotal={false}
      customActions={customActions}
    />
  );
}

export default CurrencyTable;