import { useDialogs } from '@toolpad/core/useDialogs';
import { useMutation } from '@tanstack/react-query';
import { memo, useCallback } from 'react';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import { queryClient } from '../../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../../hooks/useAppNotifications';
import { deleteCustomField } from '../../../util/http/fields';

export const DeleteCustomFieldButton = memo(({ payload }) => {
  const dialogs = useDialogs();

  const { mutateAsync, isError, isSuccess, error } = useMutation({
    mutationFn: () => deleteCustomField({ uuid: payload.uuid }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom-fields'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete custom field' });
  useSuccessNotification({ isSuccess, message: 'Custom field deleted' });

  const handleClick = useCallback(async () => {
    const msg = `Are you sure you want to delete "${payload.name}" custom field?
        This action cannot be undone and will remove all data associated with this field.`;

    const status = await dialogs.confirm(msg, {
      title: 'Delete Custom Field',
      severity: 'error',
      okText: 'Yes, continue',
      cancelText: 'Arrr, no',
    });
    if (status) {
      await mutateAsync({ payload });
    }
  }, [dialogs, payload]);

  return (
    <Tooltip title="Delete Custom Field">
      <IconButton onClick={handleClick}>
        <DeleteOutlinedIcon fontSize='small' />
      </IconButton>
    </Tooltip >
  );
});

export default DeleteCustomFieldButton;