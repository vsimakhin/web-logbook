import { useCallback } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// MUI
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';

const SortableColumnRow = ({ column, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.field });

  return (
    <ListItem ref={setNodeRef}
      sx={{
        mb: 0.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: isDragging ? 'action.selected' : 'background.paper',
        opacity: isDragging ? 0.8 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 'auto',
      }}
      secondaryAction={
        <Tooltip title="Remove from visible columns">
          <IconButton edge="end" onClick={() => onRemove(column.field)}>
            <DisabledByDefaultOutlinedIcon />
          </IconButton>
        </Tooltip>
      }
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
          cursor: 'grab',
          touchAction: 'none',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorOutlinedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', flexShrink: 0 }} />
        <ListItemText primary={column.label} slotProps={{ primary: { variant: 'body2' }, secondary: { variant: 'caption' } }}
        />
      </Box>
    </ListItem>
  );
};

export const SortableColumnList = ({ columns, onReorder, onRemove }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = columns.findIndex(
      (column) => column.field === active.id
    );

    const newIndex = columns.findIndex(
      (column) => column.field === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    onReorder(oldIndex, newIndex);
  }, [columns, onReorder]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={columns.map((column) => column.field)} strategy={verticalListSortingStrategy}>
        <List disablePadding>
          {columns.map((column) => (
            <SortableColumnRow key={column.field} column={column} onRemove={onRemove} />
          ))}
        </List>
      </SortableContext>
    </DndContext>
  );
};

export const AvailableColumnList = ({ columns, onAdd }) => (
  <List disablePadding>
    {columns.map((column) => (
      <ListItem key={column.field} sx={{ mb: 0.5, border: 1, borderColor: 'divider', borderRadius: 1 }}
        secondaryAction={
          <Tooltip title="Add to visible columns">
            <IconButton edge="end" onClick={() => onAdd(column.field)}>
              <AddBoxOutlinedIcon />
            </IconButton>
          </Tooltip>
        }
      >
        <ListItemText primary={column.label} slotProps={{ primary: { variant: 'body2' } }} />
      </ListItem>
    ))}

    {columns.length === 0 && (
      <Box sx={{ py: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
        All columns are visible.
      </Box>
    )}
  </List>
);

export default SortableColumnList;