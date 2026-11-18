import { useMutation } from '@tanstack/react-query';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import WebAssetOutlinedIcon from '@mui/icons-material/WebAssetOutlined';
import WebAssetOffOutlinedIcon from '@mui/icons-material/WebAssetOffOutlined';
// Custom
import { queryClient } from '../../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../../hooks/useAppNotifications';
import { markNewPDFPage } from '../../../util/http/logbook';

export const NewPDFPageButton = ({ flight, handleChange, handleCloseMenu }) => {
  const isMarked = flight.new_pdf_page;

  const { mutateAsync: markFlightRecord, isError: isResetError, error: resetError, isSuccess: isResetSuccess } = useMutation({
    mutationFn: () => markNewPDFPage({ id: flight.uuid, mark: !flight.new_pdf_page }),
    onSuccess: async () => {
      handleChange('new_pdf_page', !flight.new_pdf_page);
      await queryClient.invalidateQueries({ queryKey: ['flight', flight.uuid] });
    }
  });
  useErrorNotification({ isError: isResetError, error: resetError, fallbackMessage: 'Failed to mark flight record' });
  useSuccessNotification({ isSuccess: isResetSuccess, message: `Flight record ${!flight.new_pdf_page ? 'unmarked' : 'marked'}` });

  const handleOnClick = async () => {
    await markFlightRecord();
    handleCloseMenu();
  };

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleOnClick}>
      {isMarked ? <WebAssetOffOutlinedIcon color="action" sx={{ m: 1 }} /> : <WebAssetOutlinedIcon color="action" sx={{ m: 1 }} />}
      New PDF Page
    </MenuItem>
  )
}

export default NewPDFPageButton;