import { useState } from 'react';
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

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

const SaveButton = ({ category, onClose }) => {
  const navigate = useNavigate();

  const { mutateAsync: update, isError, error, isSuccess } = useMutation({
    mutationFn: () => updateAircraft({ payload: category, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['aircrafts'] });
      await queryClient.invalidateQueries({ queryKey: ['models-categories'] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to update categories' });
  useSuccessNotification({ isSuccess, message: 'Categories updates' });

  const handleOnClick = async () => {
    await update();
    onClose();
  }

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}><SaveOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export const EditCustomCategoriesModal = ({ open, onClose, payload }) => {
  const [category, setCategory] = useState({ ...payload });

  const handleChange = (key, value) => {
    setCategory(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Edit Custom Aircraft Categories"
            action={
              <>
                <SaveButton category={category} onClose={onClose} />
                <CloseDialogButton onClose={onClose} />
              </>
            }
          />
          <Grid container spacing={1}>
            <TextField gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="reg"
              label="Registration"
              handleChange={handleChange} value={category.reg}
              disabled
            />
            <TextField gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="model"
              label="Type"
              handleChange={handleChange} value={category.model}
              disabled
            />
            <AircraftCategories gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              handleChange={handleChange}
              value={category.model_category ? category.model_category.split(',') : []}
              label="Categories for Type"
              tooltip="Categories for Type"
              disabled
            />
            <AircraftCategories gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="custom_category"
              handleChange={handleChange}
              value={category.custom_category ? category.custom_category.split(',') : []}
              label="Custom Aircraft Categories"
              tooltip="Custom Aircraft Categories"
            />
          </Grid>
          <Divider sx={{ m: 1 }} />
          <Typography variant="caption" color="textSecondary">
            * To create a new category, type the name in the input field and press Enter
          </Typography>
        </CardContent>
      </Card >
    </Dialog>
  )
}

export default EditCustomCategoriesModal;