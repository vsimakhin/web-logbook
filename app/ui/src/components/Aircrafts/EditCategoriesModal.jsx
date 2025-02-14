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

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

const SaveButton = ({ category, onClose }) => {
  const navigate = useNavigate();

  const { mutateAsync: updateCategory, isError, error, isSuccess } = useMutation({
    mutationFn: () => updateAircraftModelsCategories({ payload: category, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['aircrafts'] })
      await queryClient.invalidateQueries({ queryKey: ['models-categories'] })
      await queryClient.invalidateQueries({ queryKey: ['aircraft-categories'] })
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

  const handleChange = (key, value) => {
    setCategory(prev => ({ ...prev, [key]: value }));
  };

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
        </CardContent>
      </Card >
    </Dialog>
  )
}

export default EditCategoriesModal;