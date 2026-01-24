import { convertMinutesToTime, getValue } from "../../util/helpers";

export const zeroValueCellClass = ({ value }) => {
  if (value == null) return '';
  return Number(value) === 0 ? 'dg-zero' : '';
};

export const timeColumn = (field, name) => ({
  field: field,
  headerName: name,
  width: 80,
  headerAlign: 'center',
  align: 'center',
  aggregation: 'sum',
  type: 'number',
  aggregationFormatter: (value) => convertMinutesToTime(value),
  valueGetter: (_, row) => getValue(row, field),
  valueFormatter: (value) => convertMinutesToTime(value),
  cellClassName: zeroValueCellClass,
});

export const buildCustomFieldColumns = (customFields) => {
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
        aggregationFormatter: isDuration ? (value) => convertMinutesToTime(value) : undefined,
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
          if (isDuration) return convertMinutesToTime(value);
          if (isAvg) return Number(value.toFixed(2));
          return value;
        },
        cellClassName: zeroValueCellClass,
      };
    });
};