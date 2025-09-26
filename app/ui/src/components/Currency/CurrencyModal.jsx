import { memo, useCallback, useMemo, useState } from 'react';
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
import { queryClient } from '../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import Select from '../UIElements/Select';
import { createCurrency, updateCurrency } from '../../util/http/currency';
import { comparisonOptions, metricOptions, timeframeUnitOptions } from './helpers';


const CloseDialogButton = memo(({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
});

const SaveButton = memo(({ currency, onClose }) => {
  const navigate = useNavigate();
  const isNew = currency?.uuid === 'new';
  const type = isNew ? 'create' : 'update';

  const { mutateAsync, isError, error, isSuccess } = useMutation({
    mutationFn: () => isNew ? createCurrency({ currency, navigate }) : updateCurrency({ currency, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currency'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: `Failed to ${type} currency` });
  useSuccessNotification({ isSuccess, message: `Currency ${type}d` });

  const handleOnClick = useCallback(async () => {
    await mutateAsync();
    onClose();
  }, [mutateAsync, onClose]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
});

export const CurrencyModal = ({ open, onClose, payload }) => {
  const [currency, setCurrency] = useState({ ...payload });

  const title = useMemo(() => currency?.uuid === "new" ? "New Currency" : "Edit Currency", [currency?.uuid]);

  const handleChange = useCallback((key, value) => {
    setCurrency((currency) => {
      const keys = key.split('.'); // Split key by dots to handle nesting
      let updatedCurrency = { ...currency }; // Create a shallow copy of the flight object
      let current = updatedCurrency;

      // Traverse and create nested objects as needed
      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          // Update the final key with the new value
          current[k] = value;
        } else {
          // Ensure the next level exists
          current[k] = current[k] ? { ...current[k] } : {};
          current = current[k];
        }
      });

      return updatedCurrency;
    });
  }, []);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title={title}
            action={
              <>
                <SaveButton currency={currency} onClose={onClose} />
                <CloseDialogButton onClose={onClose} />
              </>
            }
          />
          <Grid container spacing={1}>
            <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="name"
              label="Name"
              handleChange={handleChange}
              value={currency.name}
            />
            <Select gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="metric"
              label="Metric"
              handleChange={(id, value) => handleChange(id, value.value)}
              value={metricOptions().find(option => option.value === currency.metric) || null}
              options={metricOptions()}
              getOptionLabel={(option) => option.label || ""}
              isOptionEqualToValue={(option, value) => option.value === value.value}
            />
            <Select gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              id="comparison"
              label="Comparison"
              handleChange={handleChange}
              value={currency.comparison}
              options={comparisonOptions}
            />
            <TextField gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              id="target_value"
              label="Target Value"
              handleChange={handleChange}
              value={currency.target_value}
            />
            <Select gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="time_frame.unit"
              label="Timeframe Unit"
              handleChange={(id, value) => handleChange(id, value.value)}
              value={timeframeUnitOptions.find(option => option.value === currency.time_frame.unit) || null}
              options={timeframeUnitOptions}
              getOptionLabel={(option) => option.label || ""}
              isOptionEqualToValue={(option, value) => option.value === value.value}
            />
            <TextField gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="time_frame.value"
              label="Timeframe Value"
              handleChange={handleChange}
              value={currency.time_frame.value}
            />
            <AircraftCategories
              gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="filters"
              label="Filters (Aircraft Categories)"
              handleChange={handleChange}
              value={currency.filters ? currency.filters.split(',').map(item => item.trim()) : []}
            />
          </Grid>

        </CardContent>
      </Card >
    </Dialog>
  )
}

export default CurrencyModal;