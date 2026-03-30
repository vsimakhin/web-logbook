import { useContext, useMemo } from 'react';
// MUI
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
// Custom
import { ColorModeContext } from '../../../context/ColorModeContext';

export const ThemeSwitcher = () => {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ColorModeContext);
  const isDark = useMemo(() => theme.palette.mode === 'dark', [theme.palette.mode]);

  return (
    <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <IconButton onClick={toggleColorMode}>
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}

export default ThemeSwitcher;