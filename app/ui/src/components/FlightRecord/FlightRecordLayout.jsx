import { Children, useCallback, useMemo } from 'react';
import { Responsive, useContainerWidth, horizontalCompactor } from 'react-grid-layout';
// MUI
import Box from '@mui/material/Box';
// Custom
import useCustomFields from '../../hooks/useCustomFields';
import useSettings from '../../hooks/useSettings';

const BREAKPOINTS = { xl: 900, lg: 600, md: 450, sm: 300, xs: 150 };
const COLUMNS = { xl: 60, lg: 60, md: 60, sm: 60, xs: 60 };

const getLayoutStyles = (editing) => (theme) => ({
  width: '100%',
  position: 'relative',
  // Drag placeholder
  '& .react-grid-item.react-grid-placeholder': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.12)',
    border: `1.5px dashed ${theme.palette.primary.main}`,
    borderRadius: 1,
    opacity: '1 !important',
    zIndex: 2,
  },
  // Active item while being dragged
  '& .react-grid-item.react-draggable-dragging': {
    opacity: 0.9,
    boxShadow: theme.shadows[8],
    zIndex: 10,
  },
  // Resize handles
  '& .react-grid-item > .react-resizable-handle': {
    backgroundImage: 'none !important',
    width: 24,
    height: 24,
    opacity: editing ? 0.6 : 0,
    transition: 'opacity 0.2s',
    '&:hover': { opacity: 1 },
    '&::after': {
      content: '""',
      position: 'absolute',
      right: 4,
      bottom: 4,
      width: 7,
      height: 7,
      borderRight: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main}`,
      borderBottom: `2px solid ${theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main}`,
    },
  },
});

export const FlightRecordLayout = ({ editing, layouts, setLayouts, children }) => {
  const { customFields } = useCustomFields();
  const { logbookProfile } = useSettings();

  // check for the custom fields which are not in the profile yet
  const layoutsF = useMemo(() => {
    if (!customFields) return layouts;

    const result = Object.fromEntries(Object.entries(layouts).map(([breakpoint, items]) => [breakpoint, items.map((item) => ({ ...item }))]));

    customFields?.forEach((field, index) => {
      Object.keys(result).forEach((breakpoint) => {
        const layout = result[breakpoint];
        if (layout.some((item) => item.i === field.uuid)) return;
        layout.push({ i: field.uuid, x: index, y: Infinity, w: 30, h: 1, minW: 4 });
      });
    });

    return result;
  }, [customFields, layouts]);

  // apply fields visibility
  const visibleChildren = useMemo(() => {
    const visibility = logbookProfile?.fieldsVisibility;
    if (!visibility) return children;
    const result = [];
    Children.forEach(children, (child) => {
      if (!child) return;
      // Hide only when explicitly false; default to visible (e.g. 'date')
      if (child.key !== null && visibility[child.key] === false) {
        return;
      }
      result.push(child);
    });
    return result;
  }, [children, logbookProfile.fieldsVisibility]);

  // force Responsive to remount when visible fields change
  const visibilityKey = useMemo(() => `${visibleChildren.map((c) => c.key).join('-')}`, [visibleChildren]);

  const { width, containerRef, mounted } = useContainerWidth();

  const handleLayoutChange = useCallback((_layout, allLayouts) => {
    if (editing) {
      setLayouts({ ...allLayouts });
    }
  }, [editing, setLayouts]);

  return (
    <Box ref={containerRef} sx={getLayoutStyles(editing)}>
      {mounted && (
        <Responsive
          key={visibilityKey}
          width={width}
          layouts={layoutsF}
          breakpoints={BREAKPOINTS}
          cols={COLUMNS}
          rowHeight={32}
          margin={[6, 12]}
          containerPadding={[0, 0]}
          compactor={horizontalCompactor}
          dragConfig={{ enabled: editing }}
          resizeConfig={{ enabled: editing, handles: ['e', 'w'] }}
          onLayoutChange={handleLayoutChange}
        >
          {visibleChildren}
        </Responsive>
      )}
    </Box>
  )
}

export default FlightRecordLayout;