import dayjs from 'dayjs';
import { Link } from 'react-router';
// MUI Icons
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
// Custom
import { formatTimeField } from '../../util/helpers';
import NumberCell from './EditCells/NumberCell';
import FlightTimeCell from './EditCells/FlightTimeCell';
import DateCell from './EditCells/DateCell';
import TextCell from './EditCells/TextCell';
import TimeCell from './EditCells/TimeCell';
import EnrouteCell from './EditCells/EnrouteCell';

export const updateNested = (object, keys, value) => {
  const [currentKey, ...rest] = keys;

  if (!rest.length) {
    return { ...object, [currentKey]: value };
  }

  return {
    ...object,
    [currentKey]: updateNested(
      object?.[currentKey] ?? {},
      rest,
      value
    ),
  };
};

export const createDateColumn = ({ field, headerName, fieldFormat = "DD/MM/YYYY", isBulkEdit, handleRowUpdate, ...props }) => ({
  field: field,
  headerName: headerName,
  headerAlign: 'center',
  width: 90,
  type: 'date',
  valueGetter: (value) => (value ? dayjs(value, 'YYYY-MM-DD').toDate() : null),
  valueFormatter: (value) => (value ? dayjs(value).format(fieldFormat) : ''),
  renderCell: (params) => (
    isBulkEdit ? (
      <DateCell params={params} callBackFunction={handleRowUpdate} />
    ) : (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
        <Typography variant="body2" sx={{ color: "primary.main" }}>
          <Link to={`/logbook/${params.row.uuid}`} style={{ textDecoration: 'none', color: "inherit" }}>
            {params.formattedValue}
          </Link>
        </Typography>
      </Box>
    )
  ),
  ...props,
})

export const createColumn = ({ field, headerName, width, ...props }) => ({
  field: field,
  headerName: headerName,
  width: width,
  headerAlign: 'center',
  align: 'center',
  ...props,
})

export const createTimeColumn = ({ field, headerName, fieldFormat = 1, isBulkEdit, handleRowUpdate, id, ...props }) => ({
  field: field,
  headerName: headerName,
  width: 55,
  headerAlign: 'center',
  align: 'center',
  type: 'time',
  valueGetter: (_value, row) => row.time[field],
  valueFormatter: (_value, row) => formatTimeField(row.time[field], fieldFormat),
  aggregation: 'sum',
  aggregationFormatter: (value) => formatTimeField(value, fieldFormat),
  ...(isBulkEdit ? {
    renderCell: (params) =>
      <FlightTimeCell id={id} params={params} callBackFunction={handleRowUpdate} fieldFormat={fieldFormat} />
  } : {}),
  ...props,
})

export const createLandingColumn = ({ field, headerName, isBulkEdit, handleRowUpdate, ...props }) => ({
  field: field,
  headerName: headerName,
  width: 57,
  headerAlign: 'center',
  align: 'center',
  type: 'number',
  valueGetter: (_value, row) => row.landings[field === "landings_day" ? "day" : "night"] !== 0 ? row.landings[field === "landings_day" ? "day" : "night"] : null,
  aggregation: 'sum',
  ...(isBulkEdit ? {
    renderCell: (params) =>
      <NumberCell params={params} id={field === "landings_day" ? "landings.day" : "landings.night"} callBackFunction={handleRowUpdate} />
  } : {}),
  ...props,
})

export const createCustomFieldColumns = ({ customFields, category, isBulkEdit, callBackFunction, timeFieldsFormat = 1 }) => {
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
        baseColumn.type = 'time';
        baseColumn.aggregation = 'sum';
        baseColumn.valueFormatter = (_value, row) => formatTimeField(row.custom_fields[field.uuid] || 0, timeFieldsFormat);
        baseColumn.aggregationFormatter = (value) => formatTimeField(value, timeFieldsFormat);
      } else if (field.type === 'number') {
        baseColumn.aggregation = 'sum';
        baseColumn.type = 'number';
      }

      if (isBulkEdit) {
        if (field.type === 'duration') {
          baseColumn.renderCell = (params) => <FlightTimeCell id={`custom_fields.${field.uuid}`} params={params} callBackFunction={callBackFunction} fieldFormat={timeFieldsFormat} />
        } else if (field.type === 'number') {
          baseColumn.renderCell = (params) => <NumberCell params={params} id={`custom_fields.${field.uuid}`} callBackFunction={callBackFunction} />
        } else if (field.type === 'time') {
          baseColumn.renderCell = (params) => <TimeCell params={params} callBackFunction={callBackFunction} id={`custom_fields.${field.uuid}`} />
        } else if (field.type === 'enroute') {
          baseColumn.renderCell = (params) => <EnrouteCell params={params} callBackFunction={callBackFunction} id={`custom_fields.${field.uuid}`} />
        }
        else {
          baseColumn.renderCell = (params) => <TextCell params={params} callBackFunction={callBackFunction} id={`custom_fields.${field.uuid}`} />
        }
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
        <AttachFileOutlinedIcon fontSize="16" />
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