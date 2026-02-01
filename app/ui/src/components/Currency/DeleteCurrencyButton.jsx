import { useDialogs } from '@toolpad/core/useDialogs';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import { deleteCurrency } from '../../util/http/currency';
import { queryClient } from '../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { GridActionsCellItem } from '@mui/x-data-grid';

export const DeleteCurrencyButton = ({ params }) => {
  const dialogs = useDialogs();

  const { mutateAsync: removeCurrency, isError, isSuccess, error } = useMutation({
    mutationFn: () => deleteCurrency({ uuid: params.row.uuid }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currency'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete currency' });
  useSuccessNotification({ isSuccess, message: 'Currency deleted' });

  const handleClick = useCallback(async () => {
    const status = await dialogs.confirm(`Are you sure you want to delete this currency - ${params.row.name}?`, {
      title: 'Delete currency',
      severity: 'error',
      okText: 'Delete'
    });
    if (status) {
      await removeCurrency();
    }
  }, [dialogs, removeCurrency, params.row.name]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Delete Currency"><DeleteOutlinedIcon /></Tooltip>}
      onClick={handleClick}
      label="Delete Currency" showInMenu
    />
  );
};

export default DeleteCurrencyButton;