import { useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import Typography from '@mui/material/Typography';
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
import useCustomFields from '../../../hooks/useCustomFields';

const typeOptions = ["text", "autocomplete", "number", "time", "duration", "enroute"];
const TEXT_AUTOCOMPLETE_OPTIONS = ["text", "autocomplete"];

const statsFunction = {
  text: ["none", "count"],
  autocomplete: ["none", "count"],
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
  const { customFieldsCategories } = useCustomFields();

  useEffect(() => {
    if (payload) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setField({ ...payload });
    }
  }, [payload]);

  const title = field?.uuid === "new" ? "New Custom Field" : "Edit Custom Field";
  const isNew = field?.uuid === "new";
  const isTextOrAutocomplete = payload?.type === "text" || payload?.type === "autocomplete";
  const isTypeDisabled = !isNew && !isTextOrAutocomplete;
  const availableTypeOptions = !isNew && isTextOrAutocomplete ? TEXT_AUTOCOMPLETE_OPTIONS : typeOptions;

  const handleChange = useCallback((key, value) => {
    setField(prev => {
      const newField = { ...prev, [key]: value };

      if (key === "type") {
        if (!statsFunction[value]?.includes(prev.stats_function)) {
          newField.stats_function = statsFunction[value]?.[0] || "";
        }
      }

      return newField;
    });
  }, []);

  const handleClose = useCallback(() => onClose(), [onClose]);
  return (
    <Dialog maxWidth="xs" fullWidth open={open} onClose={handleClose}>
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
            <TextField gsize={{ xs: 12 }}
              id="name"
              label="Name"
              tooltip="Custom field name"
              handleChange={handleChange}
              value={field.name}
            />
            <TextField gsize={{ xs: 12 }}
              id="pdf_header"
              label="PDF Header"
              tooltip="Column name for PDF exports"
              handleChange={handleChange}
              value={field.pdf_header}
            />
            <TextField gsize={{ xs: 12 }}
              id="description"
              label="Description"
              tooltip="Custom field description"
              handleChange={handleChange}
              value={field.description}
            />
            <Select gsize={{ xs: 12 }}
              id="category"
              label="Category"
              tooltip="Custom field category"
              handleChange={handleChange}
              onBlur={(e) => handleChange("category", e.target.value)}
              value={field.category}
              options={customFieldsCategories.allCategories}
              freeSolo={true}
            />
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0 }}>
              * To add a new category, type the name in the input field
            </Typography>
            <TextField gsize={{ xs: 12 }}
              id="pdf_category"
              label="PDF Category"
              tooltip="Category header for PDF exports (optional). Disabled if the category is a default category."
              handleChange={handleChange}
              value={field.pdf_category}
              disabled={customFieldsCategories.defaultCategories.includes(field.category)}
            />
            <Select gsize={{ xs: 12, sm: 6 }}
              id="type"
              label="Type"
              tooltip="Custom field type"
              handleChange={handleChange}
              value={field.type}
              options={availableTypeOptions}
              disabled={isTypeDisabled}
            />
            <Select gsize={{ xs: 12, sm: 6 }}
              id="stats_function"
              label="Stats Function"
              tooltip="Stats function to apply to the custom field"
              handleChange={handleChange}
              value={field.stats_function}
              options={statsFunction[field.type] || []}
            />

          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  )
};

export default CustomFieldModal;