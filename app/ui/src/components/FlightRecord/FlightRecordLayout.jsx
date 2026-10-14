import { useCallback, useMemo } from 'react';
import { Responsive, useContainerWidth, horizontalCompactor } from 'react-grid-layout';
// MUI
import Box from '@mui/material/Box';
import useCustomFields from '../../hooks/useCustomFields';
// Custom


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

const DEFAULT_LAYOUT = {
  xl: [
    { i: 'date', x: 0, y: 0, w: 16, h: 1 },
  ],
  lg: [
    { i: 'date', x: 0, y: 0, w: 15, h: 1 },

    { i: 'departure.place', x: 0, y: 1, w: 10, h: 1 },
    { i: 'departure.time', x: 1, y: 1, w: 10, h: 1 },
    { i: 'arrival.place', x: 3, y: 1, w: 10, h: 1 },
    { i: 'arrival.time', x: 4, y: 1, w: 10, h: 1 },
    { i: 'landings.day', x: 5, y: 1, w: 10, h: 1 },
    { i: 'landings.night', x: 6, y: 1, w: 10, h: 1 },

    { i: 'aircraft.model', x: 0, y: 2, w: 15, h: 1 },
    { i: 'aircraft.reg_name', x: 1, y: 2, w: 15, h: 1 },
    { i: 'pic_name', x: 2, y: 2, w: 30, h: 1 },

    { i: "time.total_time", x: 0, y: 3, w: 12, h: 1 },
    { i: "time.se_time", x: 1, y: 3, w: 12, h: 1 },
    { i: "time.me_time", x: 2, y: 3, w: 12, h: 1 },
    { i: "time.mcc_time", x: 3, y: 3, w: 12, h: 1 },
    { i: "time.night_time", x: 4, y: 3, w: 12, h: 1 },

    { i: "time.ifr_time", x: 0, y: 4, w: 12, h: 1 },
    { i: "time.pic_time", x: 1, y: 4, w: 12, h: 1 },
    { i: "time.co_pilot_time", x: 2, y: 4, w: 12, h: 1 },
    { i: "time.dual_time", x: 3, y: 4, w: 12, h: 1 },
    { i: "time.instructor_time", x: 4, y: 4, w: 12, h: 1 },

    { i: 'sim.type', x: 0, y: 5, w: 12, h: 1 },
    { i: 'sim.time', x: 1, y: 5, w: 12, h: 1 },
    { i: 'tags', x: 3, y: 5, w: 36, h: 1 },

    { i: 'remarks', x: 0, y: 6, w: 60, h: 1 },
  ],
  md: [
    { i: 'date', x: 0, y: 0, w: 12, h: 1 },
  ],
  sm: [
    { i: 'date', x: 0, y: 0, w: 12, h: 1 },
  ],
  xs: [
    { i: 'date', x: 0, y: 0, w: 12, h: 1 },
  ]
};

export const FlightRecordLayout = ({ editing, children }) => {
  const { customFields } = useCustomFields();

  const layouts = useMemo(() => {
    const result = Object.fromEntries(
      Object.entries(DEFAULT_LAYOUT).map(([breakpoint, items]) => [
        breakpoint,
        items.map((item) => ({ ...item })),
      ])
    );

    customFields?.forEach((field, index) => {
      Object.keys(result).forEach((breakpoint) => {
        const layout = result[breakpoint];

        // Avoid adding duplicate items
        if (layout.some((item) => item.i === field.uuid)) {
          return;
        }

        layout.push({
          i: field.uuid,
          x: index,
          y: Infinity,
          w: 8,
          h: 1,
          minW: 4,
        });
      });
    });

    return result;
  }, [customFields]);

  console.log(layouts)
  const { width, containerRef, mounted } = useContainerWidth();
  const handleLayoutChange = useCallback((layout, allLayouts) => {
    if (editing) {
      console.log(layout, allLayouts)
    }
  }, [editing]);

  return (
    <Box ref={containerRef} sx={getLayoutStyles(editing)}>
      {mounted && (
        <Responsive
          width={width}
          layouts={layouts}
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
          {children}
        </Responsive>
      )}
    </Box>
  )
}

export default FlightRecordLayout;