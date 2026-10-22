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
import AircraftTypeCell from './EditCells/AircraftTypeCell';
import AircraftRegCell from './EditCells/AircraftRegCell';
import TagCell from './EditCells/TagCell';
import TextCell from './EditCells/TextCell';
import PICNameCell from './EditCells/PICNameCell';
import DepArrPlaceCell from './EditCells/DepArrPlaceCell';
import DepArrTimeCell from './EditCells/DepArrTimeCell';

export const LogbookTable = ({ data, isLoading, ...props }) => {
  const apiRef = useGridApiRef();
  const { settings, isSettingsLoading, fieldName, paginationOptions, timeFieldsFormat, dateFieldsFormat } = useSettings();
  const { customFields, isCustomFieldsLoading, customFieldsCategories } = useCustomFields();
  const footerEmptyTimeFieldFormat = useMemo(() => formatTimeField(0, timeFieldsFormat, true), [timeFieldsFormat]);

  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [updatedRows, setUpdatedRows] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRowUpdate = useCallback((uuid) => {
    setUpdatedRows(prev => prev.includes(uuid) ? prev : [...prev, uuid]);
  }, []);

  const customFieldsColumnsProps = useMemo(() => (
    { customFields, timeFieldsFormat, isBulkEdit, callBackFunction: handleRowUpdate }
  ), [customFields, timeFieldsFormat, isBulkEdit, handleRowUpdate],);

  const columns = useMemo(() => {
    if (isCustomFieldsLoading || isSettingsLoading) {
      return [];
    }

    return [
      // record number
      createColumn({ field: "record_number", headerName: "#", width: 30, type: 'number', align: 'center', valueFormatter: (value) => value.toString() }),
      // date
      createDateColumn({ field: "date", headerName: fieldName("date"), width: 90, fieldFormat: dateFieldsFormat, isBulkEdit, handleRowUpdate }),
      // departure
      createColumn({
        field: "departure_place", headerName: fieldName("dep_place"), width: 60,
        valueGetter: (_value, row) => row.departure?.place,
        ...(isBulkEdit ? { renderCell: (params) => <DepArrPlaceCell params={params} callBackFunction={handleRowUpdate} type="departure" /> } : {}),
      }),
      createColumn({
        field: "departure_time", headerName: fieldName("dep_time"), width: 55, type: 'string',
        valueGetter: (_value, row) => row.departure?.time,
        ...(isBulkEdit ? { renderCell: (params) => <DepArrTimeCell params={params} callBackFunction={handleRowUpdate} type="departure" /> } : {}),
      }),
      ...createCustomFieldColumns({ category: fieldName("departure"), ...customFieldsColumnsProps }),
      // arrival
      createColumn({
        field: "arrival_place", headerName: fieldName("arr_place"), width: 60,
        valueGetter: (_value, row) => row.arrival?.place,
        ...(isBulkEdit ? { renderCell: (params) => <DepArrPlaceCell params={params} callBackFunction={handleRowUpdate} type="arrival" /> } : {}),
      }),
      createColumn({
        field: "arrival_time", headerName: fieldName("arr_time"), width: 55, type: 'string',
        valueGetter: (_value, row) => row.arrival?.time,
        ...(isBulkEdit ? { renderCell: (params) => <DepArrTimeCell params={params} callBackFunction={handleRowUpdate} type="arrival" /> } : {}),
      }),
      ...createCustomFieldColumns({ category: fieldName("arrival"), ...customFieldsColumnsProps }),
      // aircraft
      createColumn({
        field: "aircraft_model", headerName: fieldName("model"), width: 70,
        valueGetter: (_value, row) => row.aircraft?.model,
        ...(isBulkEdit ? { renderCell: (params) => <AircraftTypeCell params={params} callBackFunction={handleRowUpdate} /> } : {}),
      }),
      createColumn({
        field: "aircraft_reg", headerName: fieldName("reg"), width: 75,
        valueGetter: (_value, row) => row.aircraft?.reg_name,
        ...(isBulkEdit ? { renderCell: (params) => <AircraftRegCell params={params} callBackFunction={handleRowUpdate} aircraft_model={params.row.aircraft.model} /> } : {}),
      }),
      ...createCustomFieldColumns({ category: fieldName("aircraft"), ...customFieldsColumnsProps }),
      // single pilot time
      createTimeColumn({ field: "se_time", headerName: fieldName("se"), fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      createTimeColumn({
        field: "me_time", headerName: fieldName("me"), isBulkEdit, handleRowUpdate,
        valueFormatter: (_value, row) => row.time.mcc_time !== 0 ? "" : formatTimeField(row.time.me_time, timeFieldsFormat),
        valueGetter: (_value, row) => row.time.mcc_time !== 0 ? 0 : row.time.me_time,
        aggregationFormatter: (value) => value === 0 ? "" : formatTimeField(value, timeFieldsFormat),
      }),
      ...createCustomFieldColumns({ category: fieldName("spt"), ...customFieldsColumnsProps }),
      // MCC time
      createTimeColumn({ field: "mcc_time", headerName: fieldName("mcc"), fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      ...createCustomFieldColumns({ category: fieldName("mcc"), ...customFieldsColumnsProps }),
      // total
      createTimeColumn({ field: "total_time", headerName: fieldName("total"), fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      ...createCustomFieldColumns({ category: fieldName("total"), ...customFieldsColumnsProps }),
      // pic name
      createColumn({
        field: "pic_name", headerName: fieldName("pic_name"), width: 150, align: 'left',
        ...(isBulkEdit ? { renderCell: (params) => <PICNameCell params={params} callBackFunction={handleRowUpdate} /> } : {}),
      }),
      // landings
      createLandingColumn({ field: "landings_day", headerName: fieldName("land_day"), isBulkEdit, handleRowUpdate }),
      createLandingColumn({ field: "landings_night", headerName: fieldName("land_night"), isBulkEdit, handleRowUpdate }),
      ...createCustomFieldColumns({ category: fieldName("landings"), ...customFieldsColumnsProps }),
      // operation condition time
      createTimeColumn({ field: "night_time", headerName: fieldName("night"), width: 60, fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      createTimeColumn({ field: "ifr_time", headerName: fieldName("ifr"), width: 59, fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      ...createCustomFieldColumns({ category: fieldName("oct"), ...customFieldsColumnsProps }),
      // pilot function time
      createTimeColumn({ field: "pic_time", headerName: fieldName("pic"), fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      createTimeColumn({ field: "co_pilot_time", headerName: fieldName("cop"), fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      createTimeColumn({ field: "dual_time", headerName: fieldName("dual"), fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      createTimeColumn({ field: "instructor_time", headerName: fieldName("instr"), fieldFormat: timeFieldsFormat, isBulkEdit, handleRowUpdate }),
      ...createCustomFieldColumns({ category: fieldName("pft"), ...customFieldsColumnsProps }),
      // sim
      createColumn({
        field: "sim_type", headerName: fieldName("sim_type"), width: 60, valueGetter: (_value, row) => row.sim.type,
        ...(isBulkEdit ? { renderCell: (params) => <TextCell params={params} callBackFunction={handleRowUpdate} id="sim.type" /> } : {}),
      }),
      createTimeColumn({
        id: "sim.time", field: "sim_time", headerName: fieldName("sim_time"), isBulkEdit, handleRowUpdate,
        valueGetter: (_value, row) => row.sim.time,
        valueFormatter: (_value, row) => formatTimeField(row.sim.time, timeFieldsFormat),
        aggregationFormatter: (value) => formatTimeField(value, timeFieldsFormat),
      }),
      ...createCustomFieldColumns({ category: fieldName("fstd"), ...customFieldsColumnsProps }),
      // custom
      ...createCustomFieldColumns({ category: "Custom", ...customFieldsColumnsProps }),
      // additional custom categories
      ...customFieldsCategories.userDefinedCategories.flatMap(category =>
        createCustomFieldColumns({ category, ...customFieldsColumnsProps })
      ),

      // remarks
      createColumn({
        field: "remarks", headerName: fieldName("remarks"), align: 'left', flex: 1, minWidth: 50,
        ...(isBulkEdit ? { renderCell: (params) => <TextCell params={params} callBackFunction={handleRowUpdate} /> } : {}),
      }),
      ...createCustomFieldColumns({ category: fieldName("remarks"), ...customFieldsColumnsProps }),
      // misc
      createHasTrackColumn({ field: "has_track" }),
      createHasAttachmentColumn({ field: "has_attachment" }),
      createColumn({
        field: "tags", type: "autocomplete", headerName: fieldName("tags"), align: 'left',
        ...(isBulkEdit ? { renderCell: (params) => <TagCell params={params} callBackFunction={handleRowUpdate} /> } : {}),
      }),
    ].map(col => ({ ...col, sortable: col.field === 'date' || col.field === 'record_number' }));
  }, [isSettingsLoading, isCustomFieldsLoading, fieldName, timeFieldsFormat, dateFieldsFormat, isBulkEdit, handleRowUpdate, customFieldsColumnsProps, customFieldsCategories]);

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
      ...customFieldsCategories.userDefinedCategories.map(category => {
        const children = getCustomFieldColumnsForGrouping(customFields, category);

        return children.length > 0
          ? {
            groupId: `custom-${category}`,
            headerName: <TableHeader title={category} />,
            headerAlign: "center",
            children,
          }
          : null;
      }),
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
  }, [isSettingsLoading, isCustomFieldsLoading, fieldName, customFields, customFieldsCategories]);

  const customActions = useMemo(() => (
    <>
      <NewFlightRecordButton />
      <CSVExportButton apiRef={apiRef} type="logbook" />
      <PDFExportButton />
      <BulkEditButtons
        isBulkEdit={isBulkEdit} setIsBulkEdit={setIsBulkEdit}
        setUpdatedRows={setUpdatedRows} updatedRows={updatedRows}
        apiRef={apiRef} data={data} setIsUpdating={setIsUpdating} />
    </>
  ), [apiRef, isBulkEdit, setIsBulkEdit, updatedRows, data]);

  const getRowClassName = useCallback(params => updatedRows.includes(params.id) ? "row--edited" : "", [updatedRows]);

  return (
    <XDataGrid
      apiRef={apiRef}
      tableId='logbook'
      title='Logbook'
      icon={<AutoStoriesOutlinedIcon />}
      loading={isLoading || isUpdating}
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