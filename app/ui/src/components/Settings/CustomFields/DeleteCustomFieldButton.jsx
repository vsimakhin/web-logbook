import { useDialogs } from '@toolpad/core/useDialogs';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import { queryClient } from '../../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../../hooks/useAppNotifications';
import { deleteCustomField } from '../../../util/http/fields';
import { GridActionsCellItem } from '@mui/x-data-grid';

export const DeleteCustomFieldButton = ({ params }) => {
  const dialogs = useDialogs();

  const { mutateAsync, isError, isSuccess, error } = useMutation({
    mutationFn: () => deleteCustomField({ uuid: params.row.uuid }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom-fields'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete custom field' });
  useSuccessNotification({ isSuccess, message: 'Custom field deleted' });

  const handleClick = useCallback(async () => {
    const msg = `Are you sure you want to delete "${params.row.name}" custom field?
        This action cannot be undone and will remove all data associated with this field.`;

    const status = await dialogs.confirm(msg, {
      title: 'Delete Custom Field',
      severity: 'error',
      okText: 'Yes, continue',
      cancelText: 'Arrr, no',
    });
    if (status) {
      await mutateAsync();
    }
  }, [dialogs, mutateAsync, params.row]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Delete Custom Field"><DeleteOutlinedIcon /></Tooltip>}
      onClick={handleClick}
      label="Delete Custom Field" showInMenu
    />
  );
};

export default DeleteCustomFieldButton;