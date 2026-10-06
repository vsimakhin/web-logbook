import { useMemo, useState, useCallback } from 'react';
import { useGridApiRef } from '@mui/x-data-grid';
// MUI icons
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
// MUI
import { darken } from "@mui/material/styles";
// Custom components
import XDataGrid from '../UIElements/XDataGrid/XDataGrid'
import {
  createColumn, createDateColumn, createLandingColumn,
  createTimeColumn, createCustomFieldColumns,
  getCustomFieldColumnsForGrouping,
  createHasTrackColumn,
  createHasAttachmentColumn
} from './helpers';
import NewFlightRecordButton from './NewFlightRecordButton';
import useSettings from '../../hooks/useSettings';
import useCustomFields from '../../hooks/useCustomFields';
import TableHeader from '../UIElements/TableHeader';
import CSVExportButton from '../UIElements/CSVExportButton';
import PDFExportButton from './PDFExportButton';
import { formatTimeField } from '../../util/helpers';
import BulkEditButtons from './BulkEditButtons';
import PlaceTimeCell from './EditCells/PlaceTimeCell';
import AircraftTypeCell from './EditCells/AircraftTypeCell';
import AircraftRegCell from './EditCells/AircraftRegCell';

export const LogbookTable = ({ data, isLoading, ...props }) => {
  const apiRef = useGridApiRef();
  const { settings, isSettingsLoading, fieldName, paginationOptions, timeFieldsFormat, dateFieldsFormat } = useSettings();
  const { customFields, isCustomFieldsLoading } = useCustomFields();
  const footerEmptyTimeFieldFormat = useMemo(() => formatTimeField(0, timeFieldsFormat, true), [timeFieldsFormat]);

  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [updatedRows, setUpdatedRows] = useState(new Map());
  const handleCellChange = useCallback((row, key, value) => {
    const keys = key.split(".");

    const updateNested = (object, keys, value) => {
      const [currentKey, ...rest] = keys;

      if (!rest.length) {
        return { ...object, [currentKey]: value };
      }

      return { ...object, [currentKey]: updateNested(object?.[currentKey] ?? {}, rest, value) };
    };

    const currentRow = apiRef.current.getRow(row.uuid) ?? row;
    const updatedRow = updateNested({ uuid: currentRow.uuid, ...currentRow }, keys, value);
    apiRef.current.updateRows([updatedRow]);

    setUpdatedRows((prev) => {
      const next = new Map(prev);
      const existing = next.get(updatedRow.uuid);
      next.set(updatedRow.uuid, { original: existing?.original ?? currentRow, updated: updatedRow });
      return next;
    });
  }, [apiRef]);

  const columns = useMemo(() => {
    if (isCustomFieldsLoading || isSettingsLoading) {
      return [];
    }

    return [
      // record number
      createColumn({ field: "record_number", headerName: "#", width: 30, type: 'number', align: 'center', valueFormatter: (value) => value.toString() }),
      // date
      createDateColumn({ field: "date", headerName: fieldName("date"), width: 90, fieldFormat: dateFieldsFormat }),
      // departure
      createColumn({
        field: "departure_place", headerName: fieldName("dep_place"), width: 60,
        valueGetter: (_value, row) => row.departure?.place,
        editable: true,
        ...(isBulkEdit ? { renderCell: (params) => <PlaceTimeCell params={params} handleCellChange={handleCellChange} type="departure" placeField={true} /> } : {}),
      }),
      createColumn({
        field: "departure_time", headerName: fieldName("dep_time"), width: 55, type: 'string',
        valueGetter: (_value, row) => row.departure?.time,
        editable: true,
        ...(isBulkEdit ? { renderCell: (params) => <PlaceTimeCell params={params} handleCellChange={handleCellChange} type="departure" placeField={false} /> } : {}),
      }),
      ...createCustomFieldColumns(customFields, fieldName("departure"), timeFieldsFormat),
      // arrival
      createColumn({
        field: "arrival_place", headerName: fieldName("arr_place"), width: 60,
        valueGetter: (_value, row) => row.arrival?.place,
        editable: true,
        ...(isBulkEdit ? { renderCell: (params) => <PlaceTimeCell params={params} handleCellChange={handleCellChange} type="arrival" placeField={true} /> } : {}),
      }),
      createColumn({
        field: "arrival_time", headerName: fieldName("arr_time"), width: 55, type: 'string',
        valueGetter: (_value, row) => row.arrival?.time,
        editable: true,
        ...(isBulkEdit ? { renderCell: (params) => <PlaceTimeCell params={params} handleCellChange={handleCellChange} type="arrival" placeField={false} /> } : {}),
      }),
      ...createCustomFieldColumns(customFields, fieldName("arrival"), timeFieldsFormat),
      // aircraft
      createColumn({
        field: "aircraft_model", headerName: fieldName("model"), width: 70,
        valueGetter: (_value, row) => row.aircraft?.model,
        ...(isBulkEdit ? { renderCell: (params) => <AircraftTypeCell params={params} handleCellChange={handleCellChange} /> } : {}),
      }),
      createColumn({
        field: "aircraft_reg", headerName: fieldName("reg"), width: 75,
        valueGetter: (_value, row) => row.aircraft?.reg_name,
        ...(isBulkEdit ? { renderCell: (params) => <AircraftRegCell params={params} handleCellChange={handleCellChange} aircraft_model={params.row.aircraft.model} /> } : {}),
      }),
      ...createCustomFieldColumns(customFields, fieldName("aircraft"), timeFieldsFormat),
      // single pilot time
      createTimeColumn({ field: "se_time", headerName: fieldName("se"), fieldFormat: timeFieldsFormat }),
      createTimeColumn({
        field: "me_time", headerName: fieldName("me"),
        valueFormatter: (_value, row) => row.time.mcc_time !== 0 ? "" : formatTimeField(row.time.me_time, timeFieldsFormat),
        valueGetter: (_value, row) => row.time.mcc_time !== 0 ? 0 : row.time.me_time,
        aggregation: 'sum',
        aggregationFormatter: (value) => value === 0 ? "" : formatTimeField(value, timeFieldsFormat),
      }),
      ...createCustomFieldColumns(customFields, fieldName("spt"), timeFieldsFormat),
      // MCC time
      createTimeColumn({ field: "mcc_time", headerName: fieldName("mcc"), fieldFormat: timeFieldsFormat }),
      ...createCustomFieldColumns(customFields, fieldName("mcc"), timeFieldsFormat),
      // total
      createTimeColumn({ field: "total_time", headerName: fieldName("total"), fieldFormat: timeFieldsFormat }),
      ...createCustomFieldColumns(customFields, fieldName("total"), timeFieldsFormat),
      // pic name
      createColumn({ field: "pic_name", headerName: fieldName("pic_name"), width: 150, align: 'left' }),
      // landings
      createLandingColumn({ field: "landings_day", headerName: fieldName("land_day") }),
      createLandingColumn({ field: "landings_night", headerName: fieldName("land_night") }),
      ...createCustomFieldColumns(customFields, fieldName("landings"), timeFieldsFormat),
      // operation condition time
      createTimeColumn({ field: "night_time", headerName: fieldName("night"), width: 60, fieldFormat: timeFieldsFormat }),
      createTimeColumn({ field: "ifr_time", headerName: fieldName("ifr"), width: 59, fieldFormat: timeFieldsFormat }),
      ...createCustomFieldColumns(customFields, fieldName("oct"), timeFieldsFormat),
      // pilot function time
      createTimeColumn({ field: "pic_time", headerName: fieldName("pic"), fieldFormat: timeFieldsFormat }),
      createTimeColumn({ field: "co_pilot_time", headerName: fieldName("cop"), fieldFormat: timeFieldsFormat }),
      createTimeColumn({ field: "dual_time", headerName: fieldName("dual"), fieldFormat: timeFieldsFormat }),
      createTimeColumn({ field: "instructor_time", headerName: fieldName("instr"), fieldFormat: timeFieldsFormat }),
      ...createCustomFieldColumns(customFields, fieldName("pft"), timeFieldsFormat),
      // sim
      createColumn({ field: "sim_type", headerName: fieldName("sim_type"), width: 60, valueGetter: (_value, row) => row.sim.type }),
      createColumn({
        field: "sim_time", headerName: fieldName("sim_time"),
        width: 55, headerAlign: 'center', align: 'center', type: 'time',
        valueGetter: (_value, row) => row.sim.time,
        valueFormatter: (_value, row) => formatTimeField(row.sim.time, timeFieldsFormat),
        aggregation: 'sum',
        aggregationFormatter: (value) => formatTimeField(value, timeFieldsFormat),
      }),
      ...createCustomFieldColumns(customFields, fieldName("fstd"), timeFieldsFormat),
      // custom
      ...createCustomFieldColumns(customFields, "Custom", timeFieldsFormat),
      // remarks
      createColumn({ field: "remarks", headerName: fieldName("remarks"), align: 'left', flex: 1, minWidth: 50 }),
      ...createCustomFieldColumns(customFields, fieldName("remarks"), timeFieldsFormat),
      // misc
      createHasTrackColumn({ field: "has_track" }),
      createHasAttachmentColumn({ field: "has_attachment" }),
      createColumn({ field: "tags", type: "autocomplete", headerName: fieldName("tags"), align: 'left' }),
    ].map(col => ({ ...col, sortable: col.field === 'date' || col.field === 'record_number' }));
  }, [isSettingsLoading, isCustomFieldsLoading, fieldName, customFields, timeFieldsFormat, dateFieldsFormat, handleCellChange, isBulkEdit]);

  const columnGroupingModel = useMemo(() => {
    if (isCustomFieldsLoading || isSettingsLoading) {
      return [];
    }

    return [
      {
        groupId: 'Departure',
        headerName: <TableHeader title={fieldName("departure")} />,
        headerAlign: 'center',
        children: [
          { field: 'departure_place' }, { field: 'departure_time' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("departure"))
        ],
      },
      {
        groupId: 'Arrival',
        headerName: <TableHeader title={fieldName("arrival")} />,
        headerAlign: 'center',
        children: [
          { field: 'arrival_place' }, { field: 'arrival_time' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("arrival"))
        ],
      },
      {
        groupId: 'Aircraft',
        headerName: <TableHeader title={fieldName("aircraft")} />,
        headerAlign: 'center',
        children: [
          { field: 'aircraft_model' }, { field: 'aircraft_reg' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("aircraft"))
        ],
      },
      {
        groupId: 'Single Pilot',
        headerName: <TableHeader title={fieldName("spt")} />,
        headerAlign: 'center',
        children: [
          { field: 'se_time' }, { field: 'me_time' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("spt"))
        ],
      },
      getCustomFieldColumnsForGrouping(customFields, fieldName("mcc")).length > 0 && {
        groupId: 'MCC',
        headerName: <TableHeader title={fieldName("mcc")} />,
        headerAlign: 'center',
        children: [
          { field: 'mcc_time' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("mcc"))
        ],
      },
      getCustomFieldColumnsForGrouping(customFields, fieldName("total")).length > 0 && {
        groupId: 'Total',
        headerName: <TableHeader title={fieldName("total")} />,
        headerAlign: 'center',
        children: [
          { field: 'total_time' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("total"))
        ],
      },
      {
        groupId: 'Landings',
        headerName: <TableHeader title={fieldName("landings")} />,
        headerAlign: 'center',
        children: [
          { field: 'landings_day' }, { field: 'landings_night' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("landings"))
        ],
      },
      {
        groupId: 'Operational Condition Time',
        headerName: <TableHeader title={fieldName("oct")} />,
        headerAlign: 'center',
        children: [
          { field: 'night_time' }, { field: 'ifr_time' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("oct"))
        ],
      },
      {
        groupId: 'Pilot Function Time',
        headerName: <TableHeader title={fieldName("pft")} />,
        headerAlign: 'center',
        children: [
          { field: 'pic_time' }, { field: 'co_pilot_time' }, { field: 'dual_time' }, { field: 'instructor_time' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("pft"))
        ],
      },
      {
        groupId: 'FSTD Sessions',
        headerName: <TableHeader title={fieldName("fstd")} />,
        headerAlign: 'center',
        children: [
          { field: 'sim_type' }, { field: 'sim_time' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("fstd"))
        ],
      },
      getCustomFieldColumnsForGrouping(customFields, "Custom").length > 0 && {
        groupId: 'Custom',
        headerName: <TableHeader title={"Custom"} />,
        headerAlign: 'center',
        children: [
          ...getCustomFieldColumnsForGrouping(customFields, "Custom")
        ],
      },
      getCustomFieldColumnsForGrouping(customFields, fieldName("remarks")).length > 0 && {
        groupId: 'Remarks',
        headerName: <TableHeader title={fieldName("remarks")} />,
        headerAlign: 'center',
        children: [
          { field: 'remarks' },
          ...getCustomFieldColumnsForGrouping(customFields, fieldName("remarks"))
        ],
      },
      {
        groupId: 'Misc',
        headerName: <TableHeader title={"Misc"} />,
        headerAlign: 'center',
        children: [
          { field: 'has_track' }, { field: 'has_attachment' }, { field: 'tags' },
        ],
      },
    ].filter(Boolean);
  }, [isSettingsLoading, isCustomFieldsLoading, fieldName, customFields]);

  const customActions = useMemo(() => (
    <>
      <NewFlightRecordButton />
      <CSVExportButton apiRef={apiRef} type="logbook" />
      <PDFExportButton />
      <BulkEditButtons isBulkEdit={isBulkEdit} setIsBulkEdit={setIsBulkEdit} updatedRows={updatedRows} setUpdatedRows={setUpdatedRows} apiRef={apiRef} />
    </>
  ), [apiRef, isBulkEdit, setIsBulkEdit, updatedRows, setUpdatedRows]);

  const getRowClassName = useCallback((params) => updatedRows.has(params.id) ? "row--edited" : "", [updatedRows]);

  return (
    <XDataGrid
      apiRef={apiRef}
      tableId='logbook'
      title='Logbook'
      icon={<AutoStoriesOutlinedIcon />}
      loading={isLoading}
      rows={data}
      columns={columns}
      columnGroupingModel={columnGroupingModel}
      pageSizeOptions={paginationOptions}
      getRowId={(row) => row.uuid}
      footerFieldIdTotalLabel='aircraft_reg'
      footerEmptyTimeFieldFormat={footerEmptyTimeFieldFormat}
      filterTimeFieldFormat={timeFieldsFormat}
      showAggregationFooter={true}
      showPreviousPagesTotal={settings.logbook_totals_view === 1}
      initialValues={settings.previous_experience}
      disableColumnMenu
      customActions={customActions}
      customColumnVisibilityModel={{
        record_number: false,
        has_track: false,
        has_attachment: false,
        tags: false,
      }}
      getRowClassName={getRowClassName}
      customSx={{
        "& .MuiDataGrid-row.row--edited .MuiDataGrid-cell": {
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 254, 176, 0.6)"
              : darken("rgba(255, 254, 176, 1)", 0.6),
        },
      }}
      {...props}
    />
  )
}

export default LogbookTable;