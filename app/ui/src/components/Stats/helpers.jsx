import { alpha } from "@mui/material";
import Typography from "@mui/material/Typography";
import { convertMinutesToTime, getCustomFieldValue, getValue } from "../../util/helpers";

export const zeroValueCellClass = ({ value }) => {
  if (value == null) return '';
  return Number(value) === 0 ? 'dg-zero' : '';
};

export const timeColumn = (field, name) => ({
  field: field,
  headerName: name,
  width: 65,
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

/////////////////////////////////////////

export const aggregatedCellSx = (isZero, theme) => {
  return { color: isZero ? alpha(theme.palette.primary.main, 0.44) : theme.palette.primary.main };
}

export const standardCellSx = (isZero, theme) => {
  return { color: isZero ? alpha(theme.palette.text.primary, 0.25) : 'inherit' };
}

export const createTimeColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: 90,
  muiTableBodyCellProps: { align: "center", sx: { p: 0.5 } },
  Cell: ({ cell }) => {
    const v = convertMinutesToTime(cell.getValue());
    const isZero = cell.getValue() === 0;

    return <Typography sx={(theme) => (standardCellSx(isZero, theme))}>{v}</Typography>;
  },
  aggregationFn: "sum",
  AggregatedCell: ({ cell }) => {
    const v = convertMinutesToTime(cell.getValue());
    const isZero = cell.getValue() === 0;

    return <Typography sx={(theme) => (aggregatedCellSx(isZero, theme))}>{v}</Typography>;
  },
})

export const createCustomFieldColumn = (field) => {
  const baseColumn = {
    accessorKey: `custom_fields.${field.uuid}`,
    header: field.name,
    size: 120,
    muiTableBodyCellProps: { align: "center", sx: { p: 0.5 } },
    Cell: ({ row }) => {
      const fieldData = row.original.custom_fields?.[field.uuid];
      const v = getCustomFieldValue(fieldData, field);
      return <Typography sx={(theme) => (standardCellSx(v === 0 || v === "00:00", theme))}>{v}</Typography>;
    },
  };

  // Add aggregation for grouped rows
  if (field.stats_function === 'sum' || field.stats_function === 'average') {
    baseColumn.aggregationFn = (columnId, leafRows) => {
      const totalSum = leafRows.reduce((sum, row) => {
        const fieldData = row.original.custom_fields?.[field.uuid];
        return sum + (fieldData?.sum || 0);
      }, 0);

      if (field.stats_function === 'average') {
        const totalCount = leafRows.reduce((count, row) => {
          const fieldData = row.original.custom_fields?.[field.uuid];
          return count + (fieldData?.count || 0);
        }, 0);
        const average = totalCount > 0 ? totalSum / totalCount : 0;
        return field.type === 'duration' ? convertMinutesToTime(Math.round(average)) : Number(average.toFixed(2));
      }

      return field.type === 'duration' ? convertMinutesToTime(totalSum) : totalSum;
    };
  } else if (field.stats_function === 'count') {
    baseColumn.aggregationFn = (columnId, leafRows) => {
      return leafRows.reduce((count, row) => {
        const fieldData = row.original.custom_fields?.[field.uuid];
        return count + (fieldData?.count || 0);
      }, 0);
    };
  }

  // Add AggregatedCell for grouped display
  // eslint-disable-next-line react/display-name
  baseColumn.AggregatedCell = ({ cell }) => {
    const v = cell.getValue();
    const isZero = (v === 0) || (v === "00:00");

    return <Typography sx={(theme) => (aggregatedCellSx(isZero, theme))}>{v}</Typography>;
  };

  return baseColumn;
};