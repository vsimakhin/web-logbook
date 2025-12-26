import { useDialogs } from '@toolpad/core/useDialogs';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import { deleteCurrency } from '../../util/http/currency';
import { queryClient } from '../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';

export const DeleteCurrencyButton = ({ payload }) => {
  const dialogs = useDialogs();

  const { mutateAsync: removeCurrency, isError, isSuccess, error } = useMutation({
    mutationFn: () => deleteCurrency({ uuid: payload.uuid }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currency'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete currency' });
  useSuccessNotification({ isSuccess, message: 'Currency deleted' });

  const handleClick = useCallback(async () => {
    const status = await dialogs.confirm("Are you sure you want to delete this currency?");
    if (status) {
      await removeCurrency({ payload });
    }
  }, [dialogs, payload, removeCurrency]);

  return (
    <Tooltip title="Delete Currency">
      <IconButton onClick={handleClick}>
        <DeleteOutlinedIcon fontSize='small' />
      </IconButton>
    </Tooltip >
  );
};

export default DeleteCurrencyButton;