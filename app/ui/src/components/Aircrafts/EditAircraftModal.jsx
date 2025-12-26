import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
// Custom
import CardHeader from "../UIElements/CardHeader";
import TextField from "../UIElements/TextField";
import AircraftCategories from '../UIElements/AircraftCategories';
import { updateAircraft } from '../../util/http/aircraft';
import { queryClient } from '../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import AircraftType from '../UIElements/AircraftType';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

const SaveButton = ({ aircraft, onClose }) => {
  const navigate = useNavigate();

  const { mutateAsync: update, isError, error, isSuccess } = useMutation({
    mutationFn: () => updateAircraft({ payload: aircraft, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['aircrafts'] });
      await queryClient.invalidateQueries({ queryKey: ['models-categories'] });
      if (aircraft.model_change) {
        await queryClient.invalidateQueries({ queryKey: ['logbook'] });
      }
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to update aircraft' });
  useSuccessNotification({ isSuccess, message: 'Aircraft updated' });

  const handleOnClick = useCallback(async () => {
    await update();
    onClose();
  }, [update, onClose]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}><SaveOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export const EditAircraftModal = ({ open, onClose, payload }) => {
  const [aircraft, setAircraft] = useState({ ...payload });

  const handleChange = (key, value) => {
    setAircraft(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Edit Aircraft"
            action={
              <>
                <SaveButton aircraft={{ ...aircraft, model_change: (aircraft.model !== payload.model) }} onClose={onClose} />
                <CloseDialogButton onClose={onClose} />
              </>
            }
          />
          <Grid container spacing={1}>
            <TextField gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="reg"
              label="Registration"
              handleChange={handleChange} value={aircraft.reg}
              disabled
            />
            <AircraftType gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="model"
              handleChange={handleChange}
              value={aircraft.model}
            />
            <AircraftCategories gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              handleChange={handleChange}
              value={aircraft.model_category ? aircraft.model_category.split(',') : []}
              label="Categories for Type"
              tooltip="Categories for Type"
              options="models"
              disabled
            />
            <AircraftCategories gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="custom_category"
              handleChange={handleChange}
              value={aircraft.custom_category ? aircraft.custom_category.split(',') : []}
              label="Custom Aircraft Categories"
              tooltip="Custom Aircraft Categories"
              options="custom"
            />
          </Grid>
          <Divider sx={{ m: 1 }} />
          <Typography variant="caption" color="textSecondary" display="block">
            * To create a new category, type the name in the input field and press `Enter`.
          </Typography>
          {(aircraft.model !== payload.model) && (
            <>
              <Typography variant="caption" color="error" display="block">
                * Changing the aircraft type will update all logbook flights with this aircraft.
              </Typography>
              <Typography variant="caption" color="warning" display="block">
                * If it&apos;s a new type, you will need to set the categories in the `Types & Categories` table.
              </Typography>
            </>
          )}
        </CardContent>
      </Card >
    </Dialog>
  )
}

export default EditAircraftModal;