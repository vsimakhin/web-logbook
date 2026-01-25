import { useMemo } from 'react';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid'
import {
  createColumn, createDateColumn, createLandingColumn,
  createTimeColumn, sumTime, createCustomFieldColumns,
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

export const LogbookTable = ({ data, isLoading }) => {
  const { isSettingsLoading, fieldName, paginationOptions } = useSettings();
  const { customFields, isCustomFieldsLoading } = useCustomFields();


  const columns = useMemo(() => {
    if (isCustomFieldsLoading || isSettingsLoading) {
      return [];
    }

    return [
      // date
      createDateColumn({ field: "date", headerName: fieldName("date"), width: 90 }),
      // departure
      createColumn({ field: "departure_place", headerName: fieldName("dep_place"), width: 60, valueGetter: (_value, row) => row.departure?.place }),
      createColumn({ field: "departure_time", headerName: fieldName("dep_time"), width: 55, type: 'string', valueGetter: (_value, row) => row.departure?.time }),
      ...createCustomFieldColumns(customFields, fieldName("departure")),
      // arrival
      createColumn({ field: "arrival_place", headerName: fieldName("arr_place"), width: 60, valueGetter: (_value, row) => row.arrival?.place }),
      createColumn({ field: "arrival_time", headerName: fieldName("arr_time"), width: 55, type: 'string', valueGetter: (_value, row) => row.arrival?.time }),
      ...createCustomFieldColumns(customFields, fieldName("arrival")),
      // aircraft
      createColumn({ field: "aircraft_model", headerName: fieldName("model"), width: 70, valueGetter: (_value, row) => row.aircraft?.model }),
      createColumn({ field: "aircraft_reg", headerName: fieldName("reg"), width: 75, valueGetter: (_value, row) => row.aircraft?.reg_name }),
      ...createCustomFieldColumns(customFields, fieldName("aircraft")),
      // single pilot time
      createTimeColumn({ field: "se_time", headerName: fieldName("se") }),
      createTimeColumn({ field: "me_time", headerName: fieldName("me"), valueGetter: (_value, row) => row.time.mcc_time !== "" ? "" : row.time.me_time }),
      ...createCustomFieldColumns(customFields, fieldName("spt")),
      // MCC time
      createTimeColumn({ field: "mcc_time", headerName: fieldName("mcc") }),
      ...createCustomFieldColumns(customFields, fieldName("mcc")),
      // total
      createTimeColumn({ field: "total_time", headerName: fieldName("total") }),
      ...createCustomFieldColumns(customFields, fieldName("total")),
      // pic name
      createColumn({ field: "pic_name", headerName: fieldName("pic_name"), width: 150, align: 'left' }),
      // landings
      createLandingColumn({ field: "landings_day", headerName: fieldName("land_day") }),
      createLandingColumn({ field: "landings_night", headerName: fieldName("land_night") }),
      ...createCustomFieldColumns(customFields, fieldName("landings")),
      // operation condition time
      createTimeColumn({ field: "night_time", headerName: fieldName("night"), width: 60 }),
      createTimeColumn({ field: "ifr_time", headerName: fieldName("ifr"), width: 59 }),
      ...createCustomFieldColumns(customFields, fieldName("oct")),
      // pilot function time
      createTimeColumn({ field: "pic_time", headerName: fieldName("pic") }),
      createTimeColumn({ field: "co_pilot_time", headerName: fieldName("cop") }),
      createTimeColumn({ field: "dual_time", headerName: fieldName("dual") }),
      createTimeColumn({ field: "instructor_time", headerName: fieldName("instr") }),
      ...createCustomFieldColumns(customFields, fieldName("pft")),
      // sim
      createColumn({ field: "sim_type", headerName: fieldName("sim_type"), width: 60, valueGetter: (_value, row) => row.sim.type }),
      createColumn({ field: "sim_time", headerName: fieldName("sim_time"), width: 55, headerAlign: 'center', align: 'center', type: 'time', valueGetter: (_value, row) => row.sim.time, aggregationFn: sumTime }),
      ...createCustomFieldColumns(customFields, fieldName("fstd")),
      // custom
      ...createCustomFieldColumns(customFields, "Custom"),
      // remarks
      createColumn({ field: "remarks", headerName: fieldName("remarks"), align: 'left', flex: 1, minWidth: 50 }),
      ...createCustomFieldColumns(customFields, fieldName("remarks")),
      // misc
      createHasTrackColumn({ field: "has_track" }),
      createHasAttachmentColumn({ field: "has_attachment" }),
      createColumn({ field: "tags", headerName: fieldName("tags"), align: 'left' }),

    ];
  }, [isSettingsLoading, isCustomFieldsLoading, fieldName, customFields]);

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
      <CSVExportButton rows={data} type="logbook" />
      <PDFExportButton />
    </>
  ), [data]);

  return (
    <XDataGrid
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
      showAggregationFooter={true}
      disableColumnMenu
      disableColumnSorting
      customActions={customActions}
    />
  )
}

export default LogbookTable;