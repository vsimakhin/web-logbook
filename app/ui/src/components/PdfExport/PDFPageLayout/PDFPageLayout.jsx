import { useCallback, useMemo } from 'react';
// MUI
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';
// Custom
import CardHeader from '../../UIElements/CardHeader';
import useCustomFields from '../../../hooks/useCustomFields';
import { AvailableColumnList, SortableColumnList } from './SortableColumnList';
import SaveSettingsButton from '../SaveSettingsButton';

const TABLE_COLUMNS_PATH = 'table_profile.table_columns';
const HIDDEN_COLUMNS_PATH = 'table_profile.table_hidden_columns';
const COLUMN_WIDTHS_PATH = 'table_profile.table_column_widths';
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

export const PDFPageLayout = ({ settings, handleChange, format }) => {
  const { customFields, isCustomFieldsLoading } = useCustomFields();

  const standardPageColumns = useMemo(() => {
    const fieldName = (id) => (settings.headers[id]);

    return [
      { field: 'date', category: '', label: fieldName("date") },
      { field: 'dep_place', category: fieldName("departure"), label: fieldName("dep_place") },
      { field: 'dep_time', category: fieldName("departure"), label: fieldName("dep_time") },
      { field: 'arr_place', category: fieldName("arrival"), label: fieldName("arr_place") },
      { field: 'arr_time', category: fieldName("arrival"), label: fieldName("arr_time") },
      { field: 'model', category: fieldName("aircraft"), label: fieldName("model") },
      { field: 'reg', category: fieldName("aircraft"), label: fieldName("reg") },
      { field: 'se', category: fieldName("spt"), label: fieldName("se") },
      { field: 'me', category: fieldName("spt"), label: fieldName("me") },
      { field: 'mcc', category: '', label: fieldName("mcc") },
      { field: 'total', category: '', label: fieldName("total") },
      { field: 'pic_name', category: '', label: fieldName("pic_name") },
      { field: 'land_day', category: fieldName("landings"), label: fieldName("land_day") },
      { field: 'land_night', category: fieldName("landings"), label: fieldName("land_night") },
      { field: 'night', category: fieldName("oct"), label: fieldName("night") },
      { field: 'ifr', category: fieldName("oct"), label: fieldName("ifr") },
      { field: 'pic', category: fieldName("pft"), label: fieldName("pic") },
      { field: 'cop', category: fieldName("pft"), label: fieldName("cop") },
      { field: 'dual', category: fieldName("pft"), label: fieldName("dual") },
      { field: 'instr', category: fieldName("pft"), label: fieldName("instr") },
      { field: 'sim_type', category: fieldName("fstd"), label: fieldName("sim_type") },
      { field: 'sim_time', category: fieldName("fstd"), label: fieldName("sim_time") },
      { field: 'remarks', category: '', label: fieldName("remarks") },
    ];
  }, [settings.headers]);

  const savedOrder = settings.table_profile?.table_columns ?? EMPTY_ARRAY;
  const hiddenColumns = settings.table_profile?.table_hidden_columns ?? EMPTY_ARRAY;
  const columnWidths = settings.table_profile?.table_column_widths ?? EMPTY_OBJECT;

  const allColumns = useMemo(() => {
    const customColumns =
      !isCustomFieldsLoading && customFields
        ? customFields.map((field) => ({
          field: `custom_fields.${field.uuid}`,
          label: field.name,
          category: field.category,
        }))
        : [];

    return [...standardPageColumns, ...customColumns].map((column) => ({
      ...column,
      width: columnWidths[column.field] ?? '',
    }));
  }, [customFields, isCustomFieldsLoading, standardPageColumns, columnWidths]);


  const visibleColumns = useMemo(() => {
    const allMap = new Map(allColumns.map((column) => [column.field, column]));
    const hiddenSet = new Set(hiddenColumns);

    const ordered = savedOrder
      .filter((field) => allMap.has(field) && !hiddenSet.has(field))
      .map((field) => allMap.get(field));

    const included = new Set(ordered.map((column) => column.field));

    // Standard columns are visible by default.
    // Custom fields are available by default unless explicitly saved.
    for (const column of allColumns) {
      const isCustomField = column.field.startsWith('custom_fields.');

      if (!included.has(column.field) && !hiddenSet.has(column.field) && !isCustomField) {
        ordered.push(column);
      }
    }

    return ordered;
  }, [allColumns, savedOrder, hiddenColumns]);

  const availableColumns = useMemo(() => {
    const visibleSet = new Set(visibleColumns.map((column) => column.field));

    return allColumns.filter((column) => !visibleSet.has(column.field));
  }, [allColumns, visibleColumns]);

  const handleReorder = useCallback(
    (oldIndex, newIndex) => {
      if (oldIndex === newIndex) {
        return;
      }

      const reordered = [...visibleColumns];
      const [movedColumn] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, movedColumn);

      handleChange(TABLE_COLUMNS_PATH, reordered.map((column) => column.field));
    },
    [visibleColumns, handleChange]
  );

  const handleRemove = useCallback((field) => {
    const nextOrder = visibleColumns.filter((column) => column.field !== field).map((column) => column.field);

    const nextHidden = [...new Set([...hiddenColumns, field])];

    handleChange(TABLE_COLUMNS_PATH, nextOrder);
    handleChange(HIDDEN_COLUMNS_PATH, nextHidden);
  }, [visibleColumns, hiddenColumns, handleChange]);


  const handleAdd = useCallback((field) => {
    if (visibleColumns.some((column) => column.field === field)) {
      return;
    }

    const nextOrder = [...visibleColumns.map((column) => column.field), field];
    const nextHidden = hiddenColumns.filter((hiddenField) => hiddenField !== field);

    handleChange(TABLE_COLUMNS_PATH, nextOrder);
    handleChange(HIDDEN_COLUMNS_PATH, nextHidden);
  }, [visibleColumns, hiddenColumns, handleChange]);

  const handleWidthChange = useCallback(
    (field, value) => {
      const nextWidths = { ...columnWidths };

      if (/^\d*\.?\d*$/.test(value)) {
        nextWidths[field] = value;
      } else {
        return;
      }

      handleChange(COLUMN_WIDTHS_PATH, nextWidths);
    },
    [columnWidths, handleChange]
  );

  const handleReset = useCallback(() => {
    handleChange(TABLE_COLUMNS_PATH, []);
    handleChange(HIDDEN_COLUMNS_PATH, []);
  }, [handleChange]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="PDF Export Table Layout"
          action={
            <>
              <Tooltip title="Restore column order and visibility">
                <IconButton size="small" onClick={handleReset}>
                  <SettingsBackupRestoreOutlinedIcon />
                </IconButton>
              </Tooltip>

              <SaveSettingsButton settings={settings} format={format} />
            </>
          }
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Drag visible columns to reorder them. Use the buttons to add or remove columns, then click Save to apply your changes.
        </Typography>

        <Grid container spacing={1}>
          {/* Available columns */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Available columns</Typography>

            <Box sx={{ overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <AvailableColumnList columns={availableColumns} onAdd={handleAdd} />
            </Box>
          </Grid>

          {/* Visible columns */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Visible columns</Typography>
              <Typography variant="caption" color="text.secondary">{visibleColumns.length} columns</Typography>
            </Box>

            <Box sx={{ overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <SortableColumnList columns={visibleColumns} onReorder={handleReorder} onRemove={handleRemove} onWidthChange={handleWidthChange} />

              {visibleColumns.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No visible columns. Add columns from the available list.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PDFPageLayout;