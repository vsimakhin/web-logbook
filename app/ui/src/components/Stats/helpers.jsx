import { formatTimeField, getValue } from "../../util/helpers";

export const zeroValueCellClass = ({ value }) => {
  if (value == null) return '';
  return Number(value) === 0 ? 'dg-zero' : '';
};

export const timeColumn = (field, name, format) => ({
  field: field,
  headerName: name,
  width: 80,
  headerAlign: 'center',
  align: 'center',
  aggregation: 'sum',
  type: 'number',
  aggregationFormatter: (value) => formatTimeField(value, format),
  valueGetter: (_, row) => getValue(row, field),
  valueFormatter: (value) => formatTimeField(value, format),
  cellClassName: zeroValueCellClass,
});

export const buildCustomFieldColumns = (customFields, timeFieldsFormat = 1) => {
  if (!customFields || customFields.length === 0) return [];
  return customFields
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
        aggregationFormatter: isDuration ? (value) => formatTimeField(value, timeFieldsFormat) : undefined,
        valueGetter: (_, row) => {
          const fieldData = getValue(row, `custom_fields.${field.uuid}`);
          if (!fieldData) return 0;

          if (isSum) return fieldData.sum;
          if (isAvg) return fieldData.count > 0
            ? fieldData.sum / fieldData.count
            : 0;

          if (field.stats_function === 'count') return fieldData.count;
          return 0;
        },
        valueFormatter: (value) => {
          if (isDuration) return formatTimeField(value, timeFieldsFormat);
          if (isAvg) return Number(value.toFixed(2));
          return value;
        },
        cellClassName: zeroValueCellClass,
      };
    });
};

export const createStatsColumns = ({ fieldName, customFields, timeFieldsFormat }) => {
  const baseColumns = [
    timeColumn("time.se_time", fieldName("se"), timeFieldsFormat),
    timeColumn("time.me_time", fieldName("me"), timeFieldsFormat),
    timeColumn("time.mcc_time", fieldName("mcc"), timeFieldsFormat),
    timeColumn("time.night_time", fieldName("night"), timeFieldsFormat),
    timeColumn("time.ifr_time", fieldName("ifr"), timeFieldsFormat),
    timeColumn("time.pic_time", fieldName("pic"), timeFieldsFormat),
    timeColumn("time.co_pilot_time", fieldName("cop"), timeFieldsFormat),
    timeColumn("time.dual_time", fieldName("dual"), timeFieldsFormat),
    timeColumn("time.instructor_time", fieldName("instr"), timeFieldsFormat),
    timeColumn("time.cc_time", "CC", timeFieldsFormat),
    timeColumn("sim.time", `${fieldName("fstd")} ${fieldName("sim_time")}`, timeFieldsFormat),
    {
      field: "land_day",
      headerName: `${fieldName("land_day")} ${fieldName("landings")}`,
      width: 50,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      aggregation: 'sum',
      valueGetter: (_, row) => (row.landings.day),
      cellClassName: zeroValueCellClass,
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
      cellClassName: zeroValueCellClass,
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
      cellClassName: zeroValueCellClass,
    },
  ];

  const customFieldColumns = buildCustomFieldColumns(customFields, timeFieldsFormat);

  return [
    ...baseColumns,
    ...customFieldColumns,
    timeColumn("time.total_time", fieldName("total"), timeFieldsFormat),
  ];
}