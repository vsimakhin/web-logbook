import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid2";
import Divider from "@mui/material/Divider";
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
// Custom
import CardHeader from "../UIElements/CardHeader";
import TextField from "../UIElements/TextField";
import AircraftCategories from '../UIElements/AircraftCategories';
import { updateAircraftModelsCategories } from '../../util/http/aircraft';
import { queryClient } from '../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import useSettings from '../../hooks/useSettings';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

const SaveButton = ({ category, onClose }) => {
  const { mutateAsync: updateCategory, isError, error, isSuccess } = useMutation({
    mutationFn: () => updateAircraftModelsCategories({ payload: category }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['aircrafts'] });
      await queryClient.invalidateQueries({ queryKey: ['models-categories'] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to update categories' });
  useSuccessNotification({ isSuccess, message: 'Categories updates' });

  const handleOnClick = async () => {
    await updateCategory();
    onClose();
  }

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}><SaveOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export const EditCategoriesModal = ({ open, onClose, payload }) => {
  const [category, setCategory] = useState({ ...payload });
  const { fieldNameF } = useSettings();

  const handleChange = useCallback((key, value) => {
    setCategory(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleTimeFieldChange = useCallback((key, value) => {
    setCategory(prev => ({ ...prev, time_fields_auto_fill: { ...prev.time_fields_auto_fill, [key]: value } }));
  }, []);

  const timeFields = useMemo(() => (
    [
      { id: "se_time", label: fieldNameF("se") },
      { id: "me_time", label: fieldNameF("me") },
      { id: "mcc_time", label: fieldNameF("mcc") },
      { id: "ifr_time", label: fieldNameF("ifr") },
      { id: "pic_time", label: fieldNameF("pic") },
      { id: "co_pilot_time", label: fieldNameF("cop") },
      { id: "dual_time", label: fieldNameF("dual") },
      { id: "instructor_time", label: fieldNameF("instr") },
    ]
  ), [fieldNameF]);

  const copyTotalTimeCaption = useMemo(() =>
    (`Autofill '${fieldNameF("total")}' to the time fields`), [fieldNameF]
  );

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Edit Categories"
            action={
              <>
                <SaveButton category={category} onClose={onClose} />
                <CloseDialogButton onClose={onClose} />
              </>
            }
          />
          <Grid container spacing={1}>
            <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="model"
              label="Type"
              handleChange={handleChange} value={category.model}
              disabled
            />
            <AircraftCategories gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              handleChange={handleChange} value={category.category ? category.category.split(',') : []}
            />
          </Grid>
          <Box component="fieldset" sx={{
            border: '1px solid divider',
            borderRadius: '8px',
            m: 0, width: '100%',
          }}>
            <Typography component="legend" variant="caption" color="textSecondary">
              {copyTotalTimeCaption}
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {timeFields.map((field) => (
                <Grid key={field.id} size={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                  <FormControlLabel label={field.label} sx={{ width: "100%", ml: 0.5 }}
                    control={
                      <Switch
                        checked={category.time_fields_auto_fill?.[field.id] ?? true}
                        onChange={(event) => handleTimeFieldChange(field.id, event.target.checked)}
                      />
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
          <Divider sx={{ m: 1 }} />
          <Typography variant="caption" color="textSecondary">
            * To create a new category, type the name in the input field and press Enter
          </Typography>
        </CardContent>
      </Card >
    </Dialog>
  )
}

export default EditCategoriesModal;