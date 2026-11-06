import { useCallback, useMemo } from 'react';
// MUI
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
// Custom
import CardHeader from '../UIElements/CardHeader';
import useCustomFields from '../../hooks/useCustomFields';
import useSettings from '../../hooks/useSettings';
import { AvailableColumnList, SortableColumnList } from '../UIElements/SortableColumnList';
import SaveSettingsButton from './MenuButtons/SaveSettingsButton';
import RestoreColumnsButton from './MenuButtons/RestoreColumnsButton';

const TABLE_COLUMNS_PATH = 'table_profile.table_columns';
const HIDDEN_COLUMNS_PATH = 'table_profile.table_hidden_columns';
const COLUMN_WIDTHS_PATH = 'table_profile.table_column_widths';
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const matchCategoryKey = (cat, logbookFieldName) => {
  if (!cat) return '';
  const c = cat.trim().toLowerCase();
  const check = (key) => {
    const name = logbookFieldName(key);
    return c === key.toLowerCase() || (name && c === name.toLowerCase());
  };

  if (check('departure')) return 'departure';
  if (check('arrival')) return 'arrival';
  if (check('aircraft')) return 'aircraft';
  if (check('spt') || c === 'single pilot' || c === 'single pilot time') return 'spt';
  if (check('mcc') || c === 'multi pilot time') return 'mcc';
  if (check('total') || c === 'total time') return 'total';
  if (check('landings')) return 'landings';
  if (check('oct') || c === 'operational condition time') return 'oct';
  if (check('pft') || c === 'pilot function time') return 'pft';
  if (check('fstd') || c === 'fstd session') return 'fstd';
  if (check('remarks') || c === 'remarks and endorsements') return 'remarks';
  return '';
};

export const PDFPageLayout = ({ settings, handleChange, format }) => {
  const { customFields, isCustomFieldsLoading } = useCustomFields();
  const { fieldName: logbookFieldName } = useSettings();

  const savedOrder = settings.table_profile?.table_columns ?? EMPTY_ARRAY;
  const hiddenColumns = settings.table_profile?.table_hidden_columns ?? EMPTY_ARRAY;
  const columnWidths = settings.table_profile?.table_column_widths ?? EMPTY_OBJECT;

  const allColumns = useMemo(() => {
    const pdfHeader = (id) => settings.headers[id];

    const getCustomColumns = (categoryKey) => {
      if (isCustomFieldsLoading || !customFields) return [];
      return customFields
        .filter((field) => matchCategoryKey(field.category, logbookFieldName) === categoryKey)
        .map((field) => ({
          field: `custom_fields.${field.uuid}`,
          label: field.pdf_header || field.name,
          category: pdfHeader(categoryKey) || field.category,
        }));
    };

    const getOtherCustomColumns = () => {
      if (isCustomFieldsLoading || !customFields) return [];
      return customFields
        .filter((field) => !matchCategoryKey(field.category, logbookFieldName))
        .map((field) => ({
          field: `custom_fields.${field.uuid}`,
          label: field.pdf_header || field.name,
          category: field.category || 'Custom',
        }));
    };

    const cols = [
      { field: 'date', category: '', label: pdfHeader("date") },
      { field: 'dep_place', category: pdfHeader("departure"), label: pdfHeader("dep_place") },
      { field: 'dep_time', category: pdfHeader("departure"), label: pdfHeader("dep_time") },
      ...getCustomColumns('departure'),
      { field: 'arr_place', category: pdfHeader("arrival"), label: pdfHeader("arr_place") },
      { field: 'arr_time', category: pdfHeader("arrival"), label: pdfHeader("arr_time") },
      ...getCustomColumns('arrival'),
      { field: 'model', category: pdfHeader("aircraft"), label: pdfHeader("model") },
      { field: 'reg', category: pdfHeader("aircraft"), label: pdfHeader("reg") },
      ...getCustomColumns('aircraft'),
      { field: 'se', category: pdfHeader("spt"), label: pdfHeader("se") },
      { field: 'me', category: pdfHeader("spt"), label: pdfHeader("me") },
      ...getCustomColumns('spt'),
      { field: 'mcc', category: '', label: pdfHeader("mcc") },
      ...getCustomColumns('mcc'),
      { field: 'total', category: '', label: pdfHeader("total") },
      ...getCustomColumns('total'),
      { field: 'pic_name', category: '', label: pdfHeader("pic_name") },
      { field: 'land_day', category: pdfHeader("landings"), label: pdfHeader("land_day") },
      { field: 'land_night', category: pdfHeader("landings"), label: pdfHeader("land_night") },
      ...getCustomColumns('landings'),
      { field: 'night', category: pdfHeader("oct"), label: pdfHeader("night") },
      { field: 'ifr', category: pdfHeader("oct"), label: pdfHeader("ifr") },
      ...getCustomColumns('oct'),
      { field: 'pic', category: pdfHeader("pft"), label: pdfHeader("pic") },
      { field: 'cop', category: pdfHeader("pft"), label: pdfHeader("cop") },
      { field: 'dual', category: pdfHeader("pft"), label: pdfHeader("dual") },
      { field: 'instr', category: pdfHeader("pft"), label: pdfHeader("instr") },
      ...getCustomColumns('pft'),
      { field: 'sim_type', category: pdfHeader("fstd"), label: pdfHeader("sim_type") },
      { field: 'sim_time', category: pdfHeader("fstd"), label: pdfHeader("sim_time") },
      ...getCustomColumns('fstd'),
      ...getOtherCustomColumns(),
      { field: 'remarks', category: '', label: pdfHeader("remarks") },
      ...getCustomColumns('remarks'),
    ];

    return cols.map((column) => ({
      ...column,
      width: columnWidths[column.field] ?? '',
    }));
  }, [settings.headers, customFields, isCustomFieldsLoading, logbookFieldName, columnWidths]);


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

    const allIndexMap = new Map(allColumns.map((c, i) => [c.field, i]));
    const nextCols = [...visibleColumns, allColumns.find((c) => c.field === field)].filter(Boolean);
    nextCols.sort((a, b) => (allIndexMap.get(a.field) ?? 0) - (allIndexMap.get(b.field) ?? 0));
    const nextOrder = nextCols.map((column) => column.field);
    const nextHidden = hiddenColumns.filter((hiddenField) => hiddenField !== field);

    handleChange(TABLE_COLUMNS_PATH, nextOrder);
    handleChange(HIDDEN_COLUMNS_PATH, nextHidden);
  }, [visibleColumns, allColumns, hiddenColumns, handleChange]);

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

  // TO-DO proper calculation for A5 with a page divider
  const totalWidth = visibleColumns.reduce((sum, c) => sum + (parseFloat(c.width) || 0), 0);
  const pageWidth = format === "A4" ? 297 : 210;

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title={`${format} PDF Export Table Layout`}
          action={
            <>
              <RestoreColumnsButton format={format} handleChange={handleChange} />
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
              <Typography variant="caption" color={totalWidth <= pageWidth ? "text.secondary" : "warning"}>{visibleColumns.length} columns, {totalWidth.toFixed(1)} mm of {pageWidth}</Typography>
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