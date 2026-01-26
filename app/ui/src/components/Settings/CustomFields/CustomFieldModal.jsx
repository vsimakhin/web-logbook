import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
// Custom
import CardHeader from "../../UIElements/CardHeader";
import TextField from "../../UIElements/TextField";
import Select from '../../UIElements/Select';
import { createCustomField, updateCustomField } from '../../../util/http/fields';
import { useErrorNotification, useSuccessNotification } from '../../../hooks/useAppNotifications';
import { queryClient } from '../../../util/http/http';
import useSettings from '../../../hooks/useSettings';

const typeOptions = ["text", "number", "time", "duration", "enroute"];

const statsFunction = {
  text: ["none", "count"],
  number: ["none", "sum", "average", "count"],
  time: ["none", "count"],
  duration: ["none", "sum", "average", "count"],
  enroute: ["none"],
}

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const SaveButton = ({ field, onClose }) => {
  const isNew = field?.uuid === 'new';
  const type = isNew ? 'create' : 'update';

  const { mutateAsync, isError, error, isSuccess } = useMutation({
    mutationFn: () => isNew ? createCustomField({ field }) : updateCustomField({ field }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom-fields'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: `Failed to ${type} custom field` });
  useSuccessNotification({ isSuccess, message: `Custom field ${type}d` });

  const handleOnClick = useCallback(async () => {
    await mutateAsync();
    onClose();
  }, [onClose, mutateAsync]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

export const CustomFieldModal = ({ open, onClose, payload }) => {
  const [field, setField] = useState({ ...payload });
  const { fieldName } = useSettings();

  useEffect(() => {
    if (payload) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setField({ ...payload });
    }
  }, [payload]);

  const title = useMemo(() => field?.uuid === "new" ? "New Custom Field" : "Edit Custom Field", [field?.uuid]);
  const isTypeDisabled = useMemo(() => field.uuid !== "new", [field.uuid]);

  const categoryOptions = useMemo(() => [
    "Custom",
    fieldName("departure"),
    fieldName("arrival"),
    fieldName("aircraft"),
    fieldName("spt"),
    fieldName("mcc"),
    fieldName("total"),
    fieldName("landings"),
    fieldName("oct"),
    fieldName("pft"),
    fieldName("fstd"),
    fieldName("remarks")
  ], [fieldName]);

  const handleChange = useCallback((key, value) => {
    setField(prev => {
      const newField = { ...prev, [key]: value };

      if (key === "type") {
        newField.stats_function = statsFunction[value]?.[0] || "";
      }

      return newField;
    });
  }, []);

  const handleClose = useCallback(() => onClose(), [onClose]);

  return (
    <Dialog fullWidth open={open} onClose={handleClose}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title={title}
            action={
              <>
                <SaveButton field={field} onClose={onClose} />
                <CloseDialogButton onClose={onClose} />
              </>
            }
          />
          <Grid container spacing={1}>
            <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="name"
              label="Name"
              tooltip="Custom field name"
              handleChange={handleChange}
              value={field.name}
            />
            <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="description"
              label="Description"
              tooltip="Custom field description"
              handleChange={handleChange}
              value={field.description}
            />
            <Select gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="category"
              label="Category"
              tooltip="Custom field category"
              handleChange={handleChange}
              value={field.category}
              options={categoryOptions}
              freeSolo={true}
            />
            <Select gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="type"
              label="Type"
              tooltip="Custom field type"
              handleChange={handleChange}
              value={field.type}
              options={typeOptions}
              disabled={isTypeDisabled}
            />
            <Select gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="stats_function"
              label="Stats Function"
              tooltip="Stats function to apply to the custom field"
              handleChange={handleChange}
              value={field.stats_function}
              options={statsFunction[field.type] || []}
            />
            <TextField gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              id="size_xs"
              label="Size XS"
              tooltip="Size of the field in XS breakpoint (smartphones)"
              type="number" inputProps={{ min: 1, max: 12 }}
              handleChange={handleChange}
              value={field.size_xs}
            />
            <TextField gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              id="size_md"
              label="Size MD"
              tooltip="Size of the field in MD breakpoint (tablets)"
              type="number" inputProps={{ min: 1, max: 12 }}
              handleChange={handleChange}
              value={field.size_md}
            />
            <TextField gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              id="size_lg"
              label="Size LG"
              tooltip="Size of the field in LG breakpoint (desktops)"
              type="number" inputProps={{ min: 1, max: 12 }}
              handleChange={handleChange}
              value={field.size_lg}
            />
            <TextField gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              id="display_order"
              label="Display Order"
              tooltip="Order of the field in the UI"
              type="number" inputProps={{ min: 1, max: 100 }}
              handleChange={handleChange}
              value={field.display_order}
            />
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  )
};

export default CustomFieldModal;