import { alpha } from '@mui/material/styles';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { typographyClasses } from '@mui/material/Typography';
import { buttonBaseClasses } from '@mui/material/ButtonBase';
import { iconButtonClasses } from '@mui/material/IconButton';

export const dataDisplayCustomizations = {
  MuiList: {
    styleOverrides: {
      root: {
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        [`& .${svgIconClasses.root}`]: {
          width: '1rem',
          height: '1rem',
          color: theme.palette.text.secondary,
        },
        [`& .${typographyClasses.root}`]: {
          fontWeight: 500,
        },
        [`& .${buttonBaseClasses.root}`]: {
          display: 'flex',
          gap: 8,
          padding: '2px 8px',
          borderRadius: theme.shape.borderRadius,
          opacity: 0.7,
          '&.Mui-selected': {
            opacity: 1,
            backgroundColor: alpha(theme.palette.action.selected, 0.3),
            [`& .${svgIconClasses.root}`]: {
              color: theme.palette.text.primary,
            },
            '&:focus-visible': {
              backgroundColor: alpha(theme.palette.action.selected, 0.3),
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.selected, 0.5),
            },
          },
          '&:focus-visible': {
            backgroundColor: 'transparent',
          },
        },
      }),
    },
  },
  MuiListItemText: {
    styleOverrides: {
      primary: ({ theme }) => ({
        fontSize: theme.typography.body2.fontSize,
        fontWeight: 500,
        lineHeight: theme.typography.body2.lineHeight,
      }),
      secondary: ({ theme }) => ({
        fontSize: theme.typography.caption.fontSize,
        lineHeight: theme.typography.caption.lineHeight,
      }),
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 0,
        justifyContent: 'center',
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      actions: {
        display: 'flex',
        gap: 8,
        marginRight: 6,
        [`& .${iconButtonClasses.root}`]: {
          minWidth: 0,
          width: 36,
          height: 36,
        },
      },
    },
  },

};
