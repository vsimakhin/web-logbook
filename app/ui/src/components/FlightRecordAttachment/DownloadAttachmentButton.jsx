import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
// MUI Icons
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { fetchAttachment } from '../../util/http/attachment';

export const DownloadAttachmentButton = ({ attachment, handleClose }) => {
  const { mutateAsync: downloadAttachment, isPending: isDownloadPending, isError: isDownloadError, error: downloadError, isSuccess: isDownloadSuccess } = useMutation({
    mutationFn: async () => await fetchAttachment({ id: attachment.uuid }),
    onSuccess: async (data) => {
      // Convert the base64 string to a Blob
      const byteCharacters = atob(data.document);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      // Create a link element and trigger the download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = data.document_name;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  });
  useErrorNotification({ isError: isDownloadError, error: downloadError, fallbackMessage: 'Failed to download attachment' });
  useSuccessNotification({ isSuccess: isDownloadSuccess, message: 'Attachment downloaded' });

  const handleDownload = useCallback(async () => {
    await downloadAttachment();
    handleClose();
  }, [downloadAttachment, handleClose]);

  return (
    <MenuItem onClick={handleDownload} sx={{ p: 0, pr: 1 }} disabled={isDownloadPending}>
      <CloudDownloadOutlinedIcon sx={{ m: 1 }} color="action" />{isDownloadPending && <CircularProgress size={24} />}Download
    </MenuItem>
  )
}

export default DownloadAttachmentButton;