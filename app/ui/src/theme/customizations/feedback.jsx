import { alpha } from '@mui/material/styles';
import { gray } from '../themePrimitives';

export const feedbackCustomizations = {
  MuiAlert: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        color: theme.palette.text.primary,
        border: `1px solid ${alpha(gray[300], 0.9)}`,
        ...theme.applyStyles('dark', {
          border: `1px solid ${alpha(gray[700], 0.9)}`,
        }),
      }),
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiDialog-paper': {
          borderRadius: '10px',
          border: '1px solid',
          borderColor: theme.palette.divider,
        },
      }),
    },
  },
};
