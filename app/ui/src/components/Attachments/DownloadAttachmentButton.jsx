import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
// Custom
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { fetchAttachment } from '../../util/http/attachment';
import { GridActionsCellItem } from '@mui/x-data-grid';

export const DownloadAttachmentButton = ({ attachment }) => {
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

  const handleDownload = useCallback(async () => { await downloadAttachment() }, [downloadAttachment]);

  const label = isDownloadPending
    ? <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>Download <CircularProgress size={24} /></Box>
    : "Download";

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Download"><CloudDownloadOutlinedIcon /></Tooltip>}
      disabled={isDownloadPending}
      label={label}
      onClick={handleDownload}
      showInMenu
    />
  )
}

export default DownloadAttachmentButton;