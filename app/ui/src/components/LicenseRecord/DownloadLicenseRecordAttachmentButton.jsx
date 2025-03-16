import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';

export const DownloadLicenseAttachmentButton = ({ license }) => {
  const handleDownload = useCallback(() => {
    if (!license?.document || !license?.document_name) {
      return;
    }

    try {
      // Convert the base64 string to a Blob
      const byteCharacters = atob(license.document);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      // Create a link element and trigger the download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = license.document_name;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error during file download:", error);
    }
  }, [license]);

  return (
    <Tooltip title="Download attachment">
      <IconButton size="small" onClick={handleDownload}><CloudDownloadOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export default DownloadLicenseAttachmentButton;