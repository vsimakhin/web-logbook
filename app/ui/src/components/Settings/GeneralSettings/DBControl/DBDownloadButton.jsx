import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
// MUI UI
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from "@mui/material/CircularProgress";
// MUI Icons
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
// Custom components
import { downloadDBFile, fetchDBFileName } from "../../../../util/http/db";
import { useErrorNotification, useSuccessNotification } from "../../../../hooks/useAppNotifications";

export const DBDownloadButton = ({ handleCloseMenu }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();

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
      link.download = dbfilename.split("/").pop(); // Extract filename from path
      link.click();
      URL.revokeObjectURL(link.href);
    },
  });
  useErrorNotification({ isError: isDownloadError, error: downloadError, fallbackMessage: 'Failed to download database' });
  useSuccessNotification({ isSuccess: isDownloadSuccess, message: 'Database downloaded' });

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    await downloadDB();
    setIsDownloading(false);
    handleCloseMenu();
  }, [downloadDB, handleCloseMenu, setIsDownloading]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleDownload} disabled={isDownloading}>
      <CloudDownloadOutlinedIcon color="action" sx={{ m: 1 }} />Download Database &nbsp;
      {isDownloading && <CircularProgress size={20} />}
    </MenuItem>
  )
}

export default DBDownloadButton;