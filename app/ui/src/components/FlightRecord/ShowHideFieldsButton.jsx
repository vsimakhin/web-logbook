import { useCallback, useMemo } from 'react';
import { useDialogs } from '@toolpad/core/useDialogs';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
// MUI Icons
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
// Custom
import CardHeader from "../UIElements/CardHeader";
import { FIELDS_VISIBILITY_KEY, tableJSONCodec } from '../../constants/constants';
import { FormControlLabel, Switch } from '@mui/material';
import useSettings from '../../hooks/useSettings';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const ShowHideFieldsModal = ({ open, onClose }) => {
  const [visibility, setVisibility] = useLocalStorageState(FIELDS_VISIBILITY_KEY, {}, { codec: tableJSONCodec });
  const { fieldNameF } = useSettings();

  const handleChange = useCallback((key, value) => {
    setVisibility(prev => ({ ...prev, [key]: value }));
  }, [setVisibility]);

  const fields = useMemo(() => (
    [
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
      { id: "landings.night", label: `${fieldNameF("land_night")} ${fieldNameF("landings")}` },
      { id: "simulator", label: fieldNameF("fstd") },
      { id: "remarks", label: fieldNameF("remarks") },
      { id: "tags", label: fieldNameF("tags") },
    ]
  ), [fieldNameF]);

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