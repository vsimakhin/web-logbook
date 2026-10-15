import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
// MUI Icons
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
// Custom
import CardHeader from "../UIElements/CardHeader";
import useSettings from '../../hooks/useSettings';
import useCustomFields from '../../hooks/useCustomFields';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { queryClient } from '../../util/http/http';
import { updateSettings } from '../../util/http/settings';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const ShowHideFieldsModal = ({ open, onClose }) => {
  const { settings, fieldNameF, logbookProfile } = useSettings();
  const { customFields } = useCustomFields();
  const [visibility, setVisibility] = useState(() => ({ ...logbookProfile.fieldsVisibility }));

  const { mutateAsync: saveSettings, isError, error, isSuccess } = useMutation({
    mutationFn: (updatedSettings) => updateSettings({ settings: updatedSettings }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save field visibility' });
  useSuccessNotification({ isSuccess, message: 'Field visibility saved' });

  const handleChange = useCallback(async (key, value) => {
    const updatedVisibility = { ...visibility, [key]: value };
    setVisibility(updatedVisibility);

    const updatedSettings = {
      ...settings,
      logbook_profile: {
        ...settings.logbook_profile,
        fields_visibility: updatedVisibility,
      },
    };
    await saveSettings(updatedSettings);
  }, [visibility, settings, saveSettings]);

  const fields = useMemo(() => {
    const standardFields = [
      { id: "time.total_time", label: fieldNameF("total") },
      { id: "time.se_time", label: fieldNameF("se") },
      { id: "time.me_time", label: fieldNameF("me") },
      { id: "time.mcc_time", label: fieldNameF("mcc") },
      { id: "time.night_time", label: fieldNameF("night") },
      { id: "time.ifr_time", label: fieldNameF("ifr") },
      { id: "time.pic_time", label: fieldNameF("pic") },
      { id: "time.co_pilot_time", label: fieldNameF("cop") },
      { id: "time.dual_time", label: fieldNameF("dual") },
      { id: "time.instructor_time", label: fieldNameF("instr") },
      { id: "landings.day", label: `${fieldNameF("land_day")} ${fieldNameF("landings")}` },
      { id: "landings.night", label: `${fieldNameF("land_night")} ${fieldNameF("landings")}` },
      { id: "simulator", label: fieldNameF("fstd") },
      { id: "remarks", label: fieldNameF("remarks") },
      { id: "tags", label: fieldNameF("tags") },
    ];

    if (customFields?.length) {
      customFields.forEach((field) => {
        standardFields.push({ id: field.uuid, label: field.name });
      });
    }

    return standardFields;
  }, [fieldNameF, customFields]);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Show/Hide Fields" action={<CloseDialogButton onClose={onClose} />} />
          <Grid container spacing={1}>
            {fields.map((field) => (
              <Grid key={field.id} size={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                <FormControlLabel label={field.label} sx={{ width: "100%" }}
                  control={
                    <Switch
                      checked={visibility?.[field.id] ?? true}
                      onChange={(event) => handleChange(field.id, event.target.checked)}
                    />
                  }
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  )
}

export const ShowHideFieldsButton = ({ handleCloseMenu }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    handleCloseMenu();
    await dialogs.open(ShowHideFieldsModal)
  }, [dialogs, handleCloseMenu]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleOnClick}>
      <ViewColumnIcon color="action" sx={{ m: 1 }} />Fields
    </MenuItem>
  )
}

export default ShowHideFieldsButton;