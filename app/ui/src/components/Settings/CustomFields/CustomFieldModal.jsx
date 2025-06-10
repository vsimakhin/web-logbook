import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import CardHeader from "../../UIElements/CardHeader";
import TextField from "../../UIElements/TextField";
import Select from '../../UIElements/Select';
import { createCustomField, updateCustomField } from '../../../util/http/fields';
import { useErrorNotification, useSuccessNotification } from '../../../hooks/useAppNotifications';
import { queryClient } from '../../../util/http/http';

const typeOptions = ["text", "number", "time", "duration"];

const statsFunction = {
  text: ["none", "count"],
  number: ["none", "sum", "avg", "count"],
  time: ["none", "count"],
  duration: ["none", "sum", "avg", "count"],
}

const CloseDialogButton = memo(({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
});

const SaveButton = memo(({ field, onClose }) => {
  const navigate = useNavigate();
  const isNew = field?.uuid === 'new';
  const type = isNew ? 'create' : 'update';

  const { mutateAsync, isError, error, isSuccess } = useMutation({
    mutationFn: () => isNew ? createCustomField({ field, navigate }) : updateCustomField({ field, navigate }),
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
});

export const CustomFieldModal = memo(({ open, onClose, payload }) => {
  const [field, setField] = useState({ ...payload });

  useEffect(() => {
    if (payload) {
      setField({ ...payload });
    }
  }, [payload]);

  const title = useMemo(() => field?.uuid === "new" ? "New Custom Field" : "Edit Custom Field", [field?.uuid]);
  const isTypeDisabled = useMemo(() => field.uuid !== "new", [field.uuid]);

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
            <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="name"
              label="Name"
              tooltip="Name for the custom field"
              handleChange={handleChange}
              value={field.name}
            />
            <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
              id="description"
              label="Description"
              tooltip="Description/tooltip for the custom field"
              handleChange={handleChange}
              value={field.description}
            />
            <Select gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="type"
              label="Type"
              tooltip="Type of the custom field"
              handleChange={handleChange}
              value={field.type}
              options={typeOptions}
              disabled={isTypeDisabled}
            />
            <Select gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
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
});

export default CustomFieldModal;