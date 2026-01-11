import { useCallback, useMemo, useState } from 'react';
import {
  gridColumnVisibilityModelSelector,
  useGridApiContext,
  useGridRootProps,
  isLeaf,
  gridColumnLookupSelector,
  useGridSelector,
  GridColumnsPanel,
  ToolbarButton,
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

const DRAWER_SX = {
  '& .MuiDrawer-paper': {
    marginTop: '64px',
    height: 'calc(100% - 64px)',
    boxSizing: 'border-box',
  },
};

const collectGroupLeaves = (group, columnLookup, leaves = []) => {
  group.children.forEach((child) => {
    if (isLeaf(child)) {
      if (columnLookup[child.field]?.hideable !== false) {
        leaves.push(child.field);
      }
    } else {
      collectGroupLeaves(child, columnLookup, leaves);
    }
  });
  return leaves;
};

const buildGroupingMaps = (columnGroupingModel, columnLookup) => {
  const groupLeavesMap = new Map();      // groupId -> fields[]
  const fieldToGroupMap = new Map();     // field -> top-level group

  const walk = (group, topGroup) => {
    const leaves = collectGroupLeaves(group, columnLookup);
    groupLeavesMap.set(group.groupId, leaves);

    leaves.forEach((field) => {
      fieldToGroupMap.set(field, topGroup);
    });

    group.children.forEach((child) => {
      if (!isLeaf(child)) {
        walk(child, topGroup);
      }
    });
  };

  columnGroupingModel.forEach((group) => walk(group, group));

  return { groupLeavesMap, fieldToGroupMap };
};

const ColumnGroup = ({
  group,
  leaves,
  columnLookup,
  columnVisibilityModel,
  apiRef,
  groupLeavesMap,
}) => {
  const isGroupChecked = useMemo(() => (
    leaves.some((field) => columnVisibilityModel[field] !== false)
  ), [leaves, columnVisibilityModel]);

  const toggleGroup = useCallback((_, checked) => {
    const newModel = { ...columnVisibilityModel };
    leaves.forEach((field) => {
      newModel[field] = checked;
    });
    apiRef.current.setColumnVisibilityModel(newModel);
  }, [apiRef, columnVisibilityModel, leaves]);

  const toggleColumn = useCallback((_, checked, field) => {
    apiRef.current.setColumnVisibility(field, checked);
  }, [apiRef]);

  return (
    <>
      <FormControlLabel
        control={
          <Switch checked={isGroupChecked} size="small" sx={{ p: 0.5, mt: 0.5 }} />
        }
        label={group.headerName ?? group.groupId}
        onChange={toggleGroup}
      />

      <Box sx={{ pl: 3 }}>
        {group.children
          .filter((child) => {
            if (isLeaf(child)) {
              return columnLookup[child.field]?.hideable !== false;
            }
            // For groups, we only show them if they have at least one hideable leaf
            const groupLeaves = groupLeavesMap.get(child.groupId) || [];
            return groupLeaves.some((f) => columnLookup[f]?.hideable !== false);
          })
          .map((child) =>
            isLeaf(child) ? (
              <Stack direction="row" key={child.field}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={columnVisibilityModel[child.field] !== false}
                      size="small"
                      sx={{ p: 0.5, mt: 0.5 }}
                    />
                  }
                  label={columnLookup[child.field]?.headerName ?? child.field}
                  onChange={(e, checked) => toggleColumn(e, checked, child.field)}
                />
              </Stack>
            ) : (
              <ColumnGroup
                key={child.groupId}
                group={child}
                leaves={groupLeavesMap.get(child.groupId) || []}
                columnLookup={columnLookup}
                columnVisibilityModel={columnVisibilityModel}
                apiRef={apiRef}
                groupLeavesMap={groupLeavesMap}
              />
            )
          )}
      </Box>
    </>
  );
};

export const XToolbarColumnsPanel = (props) => {
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();

  const columnLookup = useGridSelector(apiRef, gridColumnLookupSelector);
  const columnVisibilityModel = useGridSelector(apiRef, gridColumnVisibilityModelSelector);

  const columnGroupingModel = rootProps.columnGroupingModel;

  const { groupLeavesMap, fieldToGroupMap } = useMemo(() => {
    if (!columnGroupingModel) {
      return { groupLeavesMap: new Map(), fieldToGroupMap: new Map() };
    }
    return buildGroupingMaps(columnGroupingModel, columnLookup);
  }, [columnGroupingModel, columnLookup]);

  const items = useMemo(() => {
    if (!columnGroupingModel) return [];

    const renderedFields = new Set();
    const renderedGroups = new Set();
    const result = [];

    rootProps.columns.forEach((col) => {
      if (col.hideable === false) return;
      if (renderedFields.has(col.field)) return;

      const topGroup = fieldToGroupMap.get(col.field);

      if (topGroup) {
        if (!renderedGroups.has(topGroup.groupId)) {
          result.push({ type: 'group', group: topGroup });
          renderedGroups.add(topGroup.groupId);

          const leaves = groupLeavesMap.get(topGroup.groupId) || [];
          leaves.forEach((f) => renderedFields.add(f));
        }
      } else {
        result.push({ type: 'column', field: col.field });
        renderedFields.add(col.field);
      }
    });

    return result;
  }, [rootProps.columns, fieldToGroupMap, groupLeavesMap, columnGroupingModel]);

  const toggleColumn = useCallback((_, checked, field) => {
    apiRef.current.setColumnVisibility(field, checked);
  }, [apiRef]);

  if (!columnGroupingModel) {
    return <GridColumnsPanel {...props} />;
  }

  return (
    <Box sx={{ px: 2, py: 0.5 }}>
      {items.map((item) =>
        item.type === 'group' ? (
          <ColumnGroup
            key={item.group.groupId}
            group={item.group}
            leaves={groupLeavesMap.get(item.group.groupId) || []}
            columnLookup={columnLookup}
            columnVisibilityModel={columnVisibilityModel}
            apiRef={apiRef}
            groupLeavesMap={groupLeavesMap}
          />
        ) : (
          <Stack direction="row" key={item.field}>
            <FormControlLabel
              control={
                <Switch
                  checked={columnVisibilityModel[item.field] !== false}
                  size="small"
                  sx={{ p: 0.5, mt: 0.5 }}
                />
              }
              label={columnLookup[item.field]?.headerName ?? item.field}
              onChange={(e, checked) =>
                toggleColumn(e, checked, item.field)
              }
            />
          </Stack>
        )
      )}
    </Box>
  );
};

export const XToolbarColumnsPanelTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Columns">
        <ToolbarButton color="default" onClick={() => setOpen(true)}>
          <ViewColumnIcon />
        </ToolbarButton>
      </Tooltip>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} sx={DRAWER_SX}>
        <Box sx={{ minWidth: 250, p: 1 }}>
          <XToolbarColumnsPanel />
        </Box>
      </Drawer>
    </>
  );
};

export default XToolbarColumnsPanelTrigger;