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
import SaveProfileButton from './SaveProfileButton';
import useCustomFields from '../../../hooks/useCustomFields';
import { AvailableColumnList, SortableColumnList } from '../../UIElements/SortableColumnList';

const TABLE_COLUMNS_PATH = 'logbook_profile.table_columns';
const HIDDEN_COLUMNS_PATH = 'logbook_profile.table_hidden_columns';

export const LogbookLayout = ({ settings, handleChange, fieldName }) => {
  const { customFields, isCustomFieldsLoading } = useCustomFields();

  const standardLogbookColumns = useMemo(() => ([
    { field: 'record_number', category: "", label: 'Record #' },
    { field: 'date', category: "", label: fieldName("date") },
    { field: 'departure_place', category: fieldName("departure"), label: fieldName("dep_place") },
    { field: 'departure_time', category: fieldName("departure"), label: fieldName("dep_time") },
    { field: 'arrival_place', category: fieldName("arrival"), label: fieldName("arr_place") },
    { field: 'arrival_time', category: fieldName("arrival"), label: fieldName("arr_time") },
    { field: 'aircraft_model', category: fieldName("aircraft"), label: fieldName("model") },
    { field: 'aircraft_reg', category: fieldName("aircraft"), label: fieldName("reg") },
    { field: 'se_time', category: fieldName("spt"), label: fieldName("se") },
    { field: 'me_time', category: fieldName("spt"), label: fieldName("me") },
    { field: 'mcc_time', label: fieldName("mcc") },
    { field: 'total_time', label: fieldName("total") },
    { field: 'pic_name', label: fieldName("pic_name") },
    { field: 'landings_day', category: fieldName("landings"), label: fieldName("land_day") },
    { field: 'landings_night', category: fieldName("landings"), label: fieldName("land_night") },
    { field: 'night_time', category: fieldName("oct"), label: fieldName("night") },
    { field: 'ifr_time', category: fieldName("oct"), label: fieldName("ifr") },
    { field: 'pic_time', category: fieldName("pft"), label: fieldName("pic") },
    { field: 'co_pilot_time', category: fieldName("pft"), label: fieldName("cop") },
    { field: 'dual_time', category: fieldName("pft"), label: fieldName("dual") },
    { field: 'instructor_time', category: fieldName("pft"), label: fieldName("instr") },
    { field: 'sim_type', category: fieldName("fstd"), label: fieldName("sim_type") },
    { field: 'sim_time', category: fieldName("fstd"), label: fieldName("sim_time") },
    { field: 'remarks', label: fieldName("remarks") },
    { field: 'has_track', category: "Misc", label: 'Track' },
    { field: 'has_attachment', category: "Misc", label: 'Attachment' },
    { field: 'tags', category: "Misc", label: fieldName("tags") },
  ]), [fieldName]);

  const allColumns = useMemo(() => {
    const customColumns =
      !isCustomFieldsLoading && customFields
        ? customFields.map((field) => ({
          field: `custom_fields.${field.uuid}`,
          category: field.category,
          label: field.name,
        }))
        : [];

    return [...standardLogbookColumns, ...customColumns];
  }, [customFields, isCustomFieldsLoading, standardLogbookColumns]);

  const savedOrder = useMemo(() => settings.logbook_profile?.table_columns ?? [], [settings.logbook_profile?.table_columns]);
  const hiddenColumns = useMemo(() => settings.logbook_profile?.table_hidden_columns ?? [], [settings.logbook_profile?.table_hidden_columns]);

  const visibleColumns = useMemo(() => {
    const allMap = new Map(allColumns.map((column) => [column.field, column]));

    const hiddenSet = new Set(hiddenColumns);

    const ordered = savedOrder
      .filter((field) => allMap.has(field) && !hiddenSet.has(field))
      .map((field) => allMap.get(field));

    const included = new Set(ordered.map((column) => column.field));

    for (const column of allColumns) {
      if (
        !included.has(column.field) &&
        !hiddenSet.has(column.field)
      ) {
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

  const handleReset = useCallback(() => {
    handleChange(TABLE_COLUMNS_PATH, []);
    handleChange(HIDDEN_COLUMNS_PATH, []);
  }, [handleChange]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Logbook Table Layout"
          action={
            <>
              <Tooltip title="Restore column order and visibility">
                <IconButton size="small" onClick={handleReset}>
                  <SettingsBackupRestoreOutlinedIcon />
                </IconButton>
              </Tooltip>

              <SaveProfileButton settings={settings} />
            </>
          }
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Drag visible columns to reorder them. Use the buttons to add or remove columns, then click Save to apply your changes.
          You may need to refresh the logbook page (F5 or Ctrl+F5) to see the changes.
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
              <SortableColumnList columns={visibleColumns} onReorder={handleReorder} onRemove={handleRemove} />

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

export default LogbookLayout;