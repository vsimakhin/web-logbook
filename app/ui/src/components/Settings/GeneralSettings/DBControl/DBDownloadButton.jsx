import { useNavigate } from 'react-router-dom';
import { useCallback } from "react";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useMutation, useQuery } from "@tanstack/react-query";
// MUI UI
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
// Custom components
import { downloadDBFile, fetchDBFileName } from "../../../../util/http/db";
import { useErrorNotification, useSuccessNotification } from "../../../../hooks/useAppNotifications";

export const DBDownloadButton = ({ handleCloseMenu }) => {
  const navigate = useNavigate();
  const dialogs = useDialogs();

  const { data: dbfilename = "web-logbook.sql" } = useQuery({
    queryKey: ['db', 'filename'],
    queryFn: ({ signal }) => fetchDBFileName({ signal, navigate }),
    staleTime: 86400000,
    gcTime: 86400000,
    refetchOnWindowFocus: false,
  })

  const { mutateAsync: downloadDB, isError: isDownloadError, error: downloadError, isSuccess: isDownloadSuccess } = useMutation({
    mutationFn: async () => await downloadDBFile({ navigate }),
    onSuccess: (blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = dbfilename;
      link.click();
      URL.revokeObjectURL(link.href);
    },
  });
  useErrorNotification({ isError: isDownloadError, error: downloadError, fallbackMessage: 'Failed to download database' });
  useSuccessNotification({ isSuccess: isDownloadSuccess, message: 'Database downloaded' });

  const handleDownload = useCallback(async () => {
    await downloadDB();
    handleCloseMenu();
  }, [downloadDB]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleDownload}>
      <CloudDownloadOutlinedIcon color="action" sx={{ m: 1 }} />Download Database
    </MenuItem>
  )
}

export default DBDownloadButton;