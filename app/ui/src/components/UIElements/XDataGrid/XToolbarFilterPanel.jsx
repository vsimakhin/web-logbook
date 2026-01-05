import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  useGridApiContext,
  useGridSelector,
  gridVisibleColumnDefinitionsSelector,
  ToolbarButton,
  useGridRootProps,
  isLeaf,
} from '@mui/x-data-grid';
// MUI X Date Pickers
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers';
// MUI components
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
// MUI icons
import FilterListIcon from '@mui/icons-material/FilterList';
// Custom
import { useFilter } from './FilterContext';

const collectGroupLeaves = (group, leaves = []) => {
  group.children.forEach((child) => {
    if (isLeaf(child)) {
      leaves.push(child.field);
    } else {
      collectGroupLeaves(child, leaves);
    }
  });
  return leaves;
};

const buildGroupingMaps = (columnGroupingModel) => {
  const groupLeavesMap = new Map();   // groupId -> fields[]
  const fieldToGroupMap = new Map();  // field -> top group

  const walk = (group, topGroup) => {
    const leaves = collectGroupLeaves(group);
    groupLeavesMap.set(group.groupId, leaves);
    leaves.forEach((field) => fieldToGroupMap.set(field, topGroup));

    group.children.forEach((child) => {
      if (!isLeaf(child)) {
        walk(child, topGroup);
      }
    });
  };

  columnGroupingModel.forEach((group) => walk(group, group));
  return { groupLeavesMap, fieldToGroupMap };
};

const NumberFilterField = ({ label, values, onChange }) => (
  <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
    <TextField
      label={`${label} Min`}
      type="number"
      size="small"
      variant="standard"
      value={values['>='] ?? ''}
      onChange={(e) => onChange('>=', e.target.value)}
    />
    <TextField
      label={`${label} Max`}
      type="number"
      size="small"
      variant="standard"
      value={values['<='] ?? ''}
      onChange={(e) => onChange('<=', e.target.value)}
    />
  </Stack>
);

const DateFilterField = ({ label, values, onChange }) => (
  <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
    <DatePicker
      label={`${label} Min`}
      format="DD/MM/YYYY"
      value={values['>='] ? dayjs(values['>=']) : null}
      slotProps={{ field: { clearable: true, variant: 'standard', size: 'small' } }}
      onChange={(v) => onChange('>=', v ? dayjs(v) : '')}
    />
    <DatePicker
      label={`${label} Max`}
      format="DD/MM/YYYY"
      value={values['<='] ? dayjs(values['<=']) : null}
      slotProps={{ field: { clearable: true, variant: 'standard', size: 'small' } }}
      onChange={(v) => onChange('<=', v ? dayjs(v) : '')}
    />
  </Stack>
);

const TimeFilterField = ({ label, values, onChange }) => (
  <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
    <TimePicker
      label={`${label} Min`}
      ampm={false}
      format="HH:mm"
      value={values['>='] ? dayjs(values['>='], 'HH:mm') : null}
      slotProps={{ field: { clearable: true, variant: 'standard', size: 'small' } }}
      onChange={(v) => onChange('>=', v ? v.format('HH:mm') : '')}
    />
    <TimePicker
      label={`${label} Max`}
      ampm={false}
      format="HH:mm"
      value={values['<='] ? dayjs(values['<='], 'HH:mm') : null}
      slotProps={{ field: { clearable: true, variant: 'standard', size: 'small' } }}
      onChange={(v) => onChange('<=', v ? v.format('HH:mm') : '')}
    />
  </Stack>
);

const TextFilterField = ({ label, values, onChange }) => (
  <TextField
    label={label}
    size="small"
    variant="standard"
    fullWidth
    value={values.contains ?? ''}
    onChange={(e) => onChange('contains', e.target.value)}
    sx={{ mb: 0.5 }}
  />
);

const FilterField = ({ column, filterModel, onChange }) => {
  const field = column.field;
  const label = column.headerName ?? field;
  const type = column.columnType || column.type || 'string';

  const filters = useMemo(
    () => filterModel.items.filter((f) => f.field === field),
    [filterModel, field]
  );

  const [values, setValues] = useState({});

  useEffect(() => {
    const next = {};
    filters.forEach((f) => (next[f.operator] = f.value));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(next);
  }, [filters]);

  const handleChange = useCallback((operator, value) => {
    setValues((v) => ({ ...v, [operator]: value }));
    onChange(field, operator, value);
  }, [field, onChange]);

  if (type === 'number') return <NumberFilterField label={label} values={values} onChange={handleChange} />;
  if (type === 'date') return <DateFilterField label={label} values={values} onChange={handleChange} />;
  if (type === 'time') return <TimeFilterField label={label} values={values} onChange={handleChange} />;
  return <TextFilterField label={label} values={values} onChange={handleChange} />;
};

const FilterGroup = ({ group, leaves, columnMap, filterModel, onChange, level = 0 }) => {
  const columns = leaves.map((f) => columnMap.get(f)).filter((c) => c && c.filterable !== false);

  if (!columns.length) return null;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant={level === 0 ? 'subtitle2' : 'caption'} sx={{ mb: 0.5 }}>
        {group.headerName ?? group.groupId}
      </Typography>

      <Box sx={{ pl: 1.5, borderLeft: '1px solid', borderColor: 'divider' }}>
        {group.children.map((child) =>
          isLeaf(child) ? (
            columns.some((c) => c.field === child.field) && (
              <FilterField
                key={child.field}
                column={columnMap.get(child.field)}
                filterModel={filterModel}
                onChange={onChange}
              />
            )
          ) : (
            <FilterGroup
              key={child.groupId}
              group={child}
              leaves={leaves}
              columnMap={columnMap}
              filterModel={filterModel}
              onChange={onChange}
              level={level + 1}
            />
          )
        )}
      </Box>
    </Box>
  );
};

export const XToolbarFilterPanel = () => {
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const columns = useGridSelector(apiRef, gridVisibleColumnDefinitionsSelector);
  const { filterModel, updateFilter } = useFilter();

  const columnMap = useMemo(() => new Map(columns.map((c) => [c.field, c])), [columns]);

  const { groupLeavesMap, fieldToGroupMap } = useMemo(() => {
    if (!rootProps.columnGroupingModel) {
      return { groupLeavesMap: new Map(), fieldToGroupMap: new Map() };
    }
    return buildGroupingMaps(rootProps.columnGroupingModel);
  }, [rootProps.columnGroupingModel]);

  const items = useMemo(() => {
    const rendered = new Set();
    const groups = new Set();
    const result = [];

    columns.forEach((col) => {
      if (col.filterable === false || rendered.has(col.field)) return;

      const group = fieldToGroupMap.get(col.field);
      if (group) {
        if (!groups.has(group.groupId)) {
          result.push({ type: 'group', group });
          groups.add(group.groupId);
          groupLeavesMap.get(group.groupId)?.forEach((f) => rendered.add(f));
        }
      } else {
        result.push({ type: 'column', column: col });
        rendered.add(col.field);
      }
    });

    return result;
  }, [columns, fieldToGroupMap, groupLeavesMap]);

  return (
    <Box sx={{ p: 1, minWidth: 320 }}>
      {items.map((item) =>
        item.type === 'group' ? (
          <FilterGroup
            key={item.group.groupId}
            group={item.group}
            leaves={groupLeavesMap.get(item.group.groupId) || []}
            columnMap={columnMap}
            filterModel={filterModel}
            onChange={updateFilter}
          />
        ) : (
          <FilterField
            key={item.column.field}
            column={item.column}
            filterModel={filterModel}
            onChange={updateFilter}
          />
        )
      )}
    </Box>
  );
};

export const XToolbarFilterPanelTrigger = () => {
  const { filterModel } = useFilter();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const toggleFilterDrawerClose = useCallback(() => setFilterDrawerOpen(false), []);
  const toggleFilterDrawerOpen = useCallback(() => setFilterDrawerOpen(true), []);

  return (
    <>
      <Tooltip title="Filters">
        <ToolbarButton color="default" onClick={toggleFilterDrawerOpen}>
          <Badge badgeContent={filterModel.items.length}>
            <FilterListIcon fontSize="small" />
          </Badge>
        </ToolbarButton>
      </Tooltip>
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={toggleFilterDrawerClose}
      >
        <Box sx={{ width: 350, p: 2 }}>
          <XToolbarFilterPanel />
        </Box>
      </Drawer>
    </>
  );
};

export default XToolbarFilterPanelTrigger;
