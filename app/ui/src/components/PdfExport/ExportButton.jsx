import { useMutation } from '@tanstack/react-query';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
// Custom
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { fetchExport } from '../../util/http/export';

export const ExportButton = ({ format }) => {

  const { mutateAsync: runExport, isPending: isExporting, isError: isExportError, error: exportError } = useMutation({
    mutationFn: async (format) => {
      const blob = await fetchExport(format);
      const url = window.URL.createObjectURL(blob);

      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `logbook-${format}.pdf`; // Set a dynamic filename
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
    },
  });
  useErrorNotification({ isError: isExportError, error: exportError, fallbackMessage: 'Failed to export PDF' });
  useSuccessNotification({ isSuccess: isExporting, message: 'PDF Exported successfully' });

  return (
    <Tooltip title="Export">
      <IconButton onClick={async () => await runExport(format)} size="small">
        <PictureAsPdfOutlinedIcon fontSize='small' />
      </IconButton>
    </Tooltip >
  )
}

export default ExportButton;