import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
// Custom
import { useErrorNotification, useSuccessNotification } from '../../../hooks/useAppNotifications';
import { queryClient } from '../../../util/http/http';
import { updateSettings } from '../../../util/http/settings';
import useSettings from '../../../hooks/useSettings';

export const SaveLayoutButton = ({ setEditingLayout, layouts }) => {
  const { settings } = useSettings();

  const { mutateAsync: saveSettings, isError, error, isSuccess } = useMutation({
    mutationFn: (updatedSettings) => updateSettings({ settings: updatedSettings }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save layout' });
  useSuccessNotification({ isSuccess, message: 'Layout saved' });

  const handleClick = useCallback(async () => {
    const updatedSettings = {
      ...settings,
      logbook_profile: {
        ...settings.logbook_profile,
        flightRecordLayout: layouts,
      },
    };
    await saveSettings(updatedSettings);
    setEditingLayout(false);
  }, [settings, layouts, saveSettings, setEditingLayout]);

  return (
    <Tooltip title="Save Layout">
      <IconButton size="small" onClick={handleClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default SaveLayoutButton;