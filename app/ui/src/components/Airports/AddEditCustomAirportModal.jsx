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
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
// Custom
import CardHeader from "../UIElements/CardHeader";
import TextField from "../UIElements/TextField";
import { queryClient } from '../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { createCustomAirport, updateCustomAirport } from '../../util/http/airport';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

const SaveButton = ({ airport, isNew, onClose }) => {
  const navigate = useNavigate();

  const payload = {
    name: airport.name,
    city: airport.city,
    country: airport.country,
    elevation: parseInt(airport.elevation) || 0,
    lat: parseFloat(airport.lat) || parseFloat(0),
    lon: parseFloat(airport.lon) || parseFloat(0),
  };

  const mutateFn = isNew ? () => createCustomAirport({ payload, navigate }) : () => updateCustomAirport({ payload, navigate });
  const { mutateAsync: saveAirport, isError, error, isSuccess } = useMutation({
    mutationFn: mutateFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom-airports'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to custom save airport' });
  useSuccessNotification({ isSuccess, message: 'Custom airport saved' });

  const handleOnClick = useCallback(async () => {
    await saveAirport();
    onClose();
  }, [saveAirport, onClose]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}><SaveOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export const AddEditCustomAirportModal = ({ open, onClose, payload }) => {
  const [airport, setAirport] = useState({ ...payload });
  const isNew = payload.isNew;

  const handleChange = (key, value) => {
    setAirport(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title={`Custom Airport ${airport?.name || ''}`}
            action={
              <>
                <SaveButton airport={airport} onClose={onClose} isNew={isNew} />
                <CloseDialogButton onClose={onClose} />
              </>
            }
          />
          <Grid container spacing={1}>
            <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="name"
              label="Name/Code"
              handleChange={handleChange}
              value={airport.name}
              required
              disabled={!isNew}
            />
            <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="city"
              label="City"
              handleChange={handleChange}
              value={airport.city}
            />
            <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="country"
              label="Country"
              handleChange={handleChange}
              value={airport.country}
            />
            <TextField gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="elevation"
              label="Elevation"
              handleChange={handleChange}
              value={airport.elevation}
            />
            <TextField gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="lat"
              label="Lat"
              handleChange={handleChange}
              value={airport.lat}
            />
            <TextField gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="lon"
              label="Lon"
              handleChange={handleChange}
              value={airport.lon}
            />
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  )
}

export default AddEditCustomAirportModal;