// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { fetchExport } from '../../util/http/export';

export const PDFExportButton = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const { mutate: runExport, isPending: isExporting, isError: isExportError, error: exportError } = useMutation({
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

  const handleClick = (event) => { setAnchorEl(event.currentTarget) };
  const handleClose = () => { setAnchorEl(null) };

  const handleExport = (format) => {
    runExport(format);
    handleClose();
  };

  return (
    <>
      <Tooltip title="PDF Export">
        <IconButton onClick={handleClick} size="small">
          <PictureAsPdfOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem onClick={() => handleExport("A4")}>
          <PictureAsPdfOutlinedIcon /> Export PDF A4
        </MenuItem>
        <MenuItem onClick={() => handleExport("A5")}>
          <PictureAsPdfOutlinedIcon /> Export PDF A5
        </MenuItem>
      </Menu>
    </>
  )
}

export default PDFExportButton;