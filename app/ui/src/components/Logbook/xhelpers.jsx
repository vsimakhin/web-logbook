import dayjs from 'dayjs';
import { Link } from 'react-router';

import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';

import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';

export const sumTime = (values) => {
  let totalMinutes = 0;
  values.forEach(v => {
    if (typeof v === 'string' && v.includes(':')) {
      const parts = v.split(':');
      if (parts.length === 2) {
        const hh = parseInt(parts[0], 10) || 0;
        const mm = parseInt(parts[1], 10) || 0;
        totalMinutes += (hh * 60) + mm;
      }
    } else if (typeof v === 'number') {
      totalMinutes += Math.round(v * 60);
    }
  });

  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${hh}:${mm.toString().padStart(2, '0')}`;
}

export const createDateColumn = ({ field, headerName, width = 90 }) => ({
  field: field,
  headerName: headerName,
  headerAlign: 'center',
  width: width,
  type: 'date',
  valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
  valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
  renderCell: (params) => (
    <Typography variant="body2" color="primary">
      <Link to={`/logbook/${params.row.uuid}`} style={{ textDecoration: 'none', color: "inherit" }}>
        {params.formattedValue}
      </Link>
    </Typography>
  ),
})

export const createColumn = ({ field, headerName, width, headerAlign = 'center', align = 'center', ...props }) => ({
  field: field,
  headerName: headerName,
  width: width,
  headerAlign: headerAlign,
  align: align,
  ...props,
})

export const createTimeColumn = ({ field, headerName, width = 55, headerAlign = 'center', align = 'center', ...props }) => ({
  field: field,
  headerName: headerName,
  width: width,
  headerAlign: headerAlign,
  align: align,
  type: 'time',
  valueGetter: (_value, row) => row.time[field],
  aggregationFn: sumTime,
  ...props,
})

export const createLandingColumn = ({ field, headerName, width = 57, headerAlign = 'center', align = 'center', ...props }) => ({
  field: field,
  headerName: headerName,
  width: width,
  headerAlign: headerAlign,
  align: align,
  type: 'number',
  valueGetter: (_value, row) => row.landings[field === "landings_day" ? "day" : "night"] !== 0 ? row.landings[field === "landings_day" ? "day" : "night"] : null,
  aggregation: 'sum',
  ...props,
})

export const createCustomFieldColumns = (customFields, category) => {
  if (!customFields || !Array.isArray(customFields)) {
    return [];
  }
  return customFields
    .filter(field => field.category === category)
    .map(field => {
      const baseColumn = {
        field: `custom_fields.${field.uuid}`,
        headerName: field.name,
        size: 100,
        headerAlign: 'center',
        align: 'center',
        valueGetter: (_value, row) => row.custom_fields[field.uuid],
      };

      // Add time footer for duration fields
      if (field.type === 'duration') {
        baseColumn.type = 'time'
        baseColumn.aggregationFn = sumTime
      } else if (field.type === 'number') {
        baseColumn.aggregation = 'sum'
        baseColumn.type = 'number'
      }

      return baseColumn;
    })
}

export const createHasTrackColumn = ({ field, width = 20, headerAlign = 'center', align = 'center', ...props }) => ({
  field: field,
  headerName:
    <Tooltip title="Shows an icon if a flight record has a track attached">
      <MapOutlinedIcon fontSize="small" />
    </Tooltip>,
  width: width,
  headerAlign: headerAlign,
  align: align,
  type: 'boolean',
  valueGetter: (_value, row) => row.has_track,
  ...props,
})

export const createHasAttachmentColumn = ({ field, width = 20, headerAlign = 'center', align = 'center', ...props }) => ({
  field: field,
  headerName:
    <Tooltip title="Shows an icon with a badge indicating the number of attachments">
      <AttachFileOutlinedIcon fontSize="small" />
    </Tooltip>,
  width: width,
  headerAlign: headerAlign,
  align: align,
  type: 'boolean',
  valueGetter: (_value, row) => row.attachments_count,
  renderCell: (params) => (
    params.row.attachments_count > 0 ?
      <Badge badgeContent={params.row.attachments_count}>
        <AttachFileOutlinedIcon fontSize="small" />
      </Badge>
      : ""
  ),
  ...props,
})

export const getCustomFieldColumnsForGrouping = (customFields, category) => {
  if (!customFields || !Array.isArray(customFields)) {
    return [];
  }
  return customFields
    .filter(field => field.category === category)
    .map(field => ({ field: `custom_fields.${field.uuid}` }))
}