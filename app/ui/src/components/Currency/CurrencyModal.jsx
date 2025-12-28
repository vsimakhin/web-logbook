import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
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
import { comparisonOptions, timeframeUnitOptions } from './helpers';
import DatePicker from '../UIElements/DatePicker';
import useSettings from '../../hooks/useSettings';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const SaveButton = ({ currency, onClose }) => {
  const isNew = currency?.uuid === 'new';
  const type = isNew ? 'create' : 'update';

  const { mutateAsync, isError, error, isSuccess } = useMutation({
    mutationFn: () => isNew ? createCurrency({ currency }) : updateCurrency({ currency }),
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
};

export const CurrencyModal = ({ open, onClose, payload }) => {
  const { fieldNameF } = useSettings();
  const [currency, setCurrency] = useState({ ...payload });
  const title = useMemo(() => currency?.uuid === "new" ? "New Currency" : "Edit Currency", [currency?.uuid]);

  const metricOptions = useMemo(() => (
    [
      { value: "time.total_time", label: fieldNameF("total") },
      { value: "time.se_time", label: fieldNameF("se") },
      { value: "time.me_time", label: fieldNameF("me") },
      { value: "time.mcc_time", label: fieldNameF("mcc") },
      { value: "time.night_time", label: fieldNameF("night") },
      { value: "time.ifr_time", label: fieldNameF("ifr") },
      { value: "time.pic_time", label: fieldNameF("pic") },
      { value: "time.co_pilot_time", label: fieldNameF("cop") },
      { value: "time.dual_time", label: fieldNameF("dual") },
      { value: "time.instructor_time", label: fieldNameF("instr") },
      { value: "landings.all", label: fieldNameF("landings") },
      { value: "landings.day", label: `${fieldNameF("land_day")} ${fieldNameF("landings")}` },
      { value: "landings.night", label: `${fieldNameF("land_night")} ${fieldNameF("landings")}` },
      { value: "sim.time", label: `${fieldNameF("fstd")} ${fieldNameF("sim_time")}` },
    ]
  ), [fieldNameF]);

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

  const currencyTimeFrame = () => {
    if (currency.time_frame.unit !== 'all_time' && currency.time_frame.unit !== 'since') {
      return (
        <TextField gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="time_frame.value"
          label="Timeframe Value"
          handleChange={handleChange}
          value={currency.time_frame.value}
        />
      );
    } else if (currency.time_frame.unit === 'since') {
      return (
        <DatePicker gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="time_frame.since"
          handleChange={handleChange}
          label={"Since Date"}
          value={dayjs(currency?.time_frame?.since ?? dayjs().format('DD/MM/YYYY'), "DD/MM/YYYY")}
        />
      )
    } else {
      return null;
    }
  };

  const actionButtons = useMemo(() => (
    <>
      <SaveButton currency={currency} onClose={onClose} />
      <CloseDialogButton onClose={onClose} />
    </>
  ), [currency, onClose]);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title={title} action={actionButtons} />
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
              value={metricOptions.find(option => option.value === currency.metric) || null}
              options={metricOptions}
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
            {currencyTimeFrame()}
            <AircraftCategories
              gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="filters"
              label="Filters (Aircraft Categories)"
              handleChange={handleChange}
              value={currency.filters ? currency.filters.split(',').map(item => item.trim()) : []}
              options="all"
            />
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  )
}

export default CurrencyModal;