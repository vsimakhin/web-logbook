import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import { updatePdfSettings } from "../../util/http/settings";

const INT_FIELDS = [
  'logbook_rows', 'fill', 'left_margin', 'left_margin_a', 'left_margin_b',
  'top_margin', 'body_row_height', 'footer_row_height', 'time_fields_auto_format'
];

const parseNumericFields = (obj, fields, parser) => {
  return fields.reduce((acc, field) => {
    acc[field] = parser(obj[field]) || 0;
    return acc;
  }, {});
};

const parseColumns = (columns) => {
  const columnCount = 23;
  return Array.from({ length: columnCount }, (_, i) => `col${i + 1}`)
    .reduce((acc, col) => {
      acc[col] = parseFloat(columns[col]) || 0.0;
      return acc;
    }, {});
};

export const SaveSettingsButton = ({ settings, format }) => {
  const navigate = useNavigate();

  const { mutateAsync: saveSettings, isError, error, isSuccess } = useMutation({
    mutationFn: ({ settings, format }) => updatePdfSettings({ settings, format, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save settings' });
  useSuccessNotification({ isSuccess, message: 'Settings saved' });

  const onSave = async () => {
    const parsedSettings = {
      ...settings,
      ...parseNumericFields(settings, INT_FIELDS, parseInt),
      columns: parseColumns(settings.columns)
    };
    await saveSettings({ settings: parsedSettings, format });
  }
  return (
    <>
      <Tooltip title="Save settings">
        <IconButton size="small" onClick={onSave}><SaveOutlinedIcon /></IconButton>
      </Tooltip>
    </>
  );
}

export default SaveSettingsButton;