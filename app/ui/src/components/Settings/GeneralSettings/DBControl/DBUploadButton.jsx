import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from "react";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useMutation, useQuery } from "@tanstack/react-query";
// MUI UI
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from "@mui/material/CircularProgress";
// MUI Icons
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
// Custom components
import { fetchDBFileName, uploadDBFile } from "../../../../util/http/db";
import { useErrorNotification, useSuccessNotification } from "../../../../hooks/useAppNotifications";
import { queryClient } from "../../../../util/http/http";

export const DBUploadButton = ({ handleCloseMenu }) => {
  const navigate = useNavigate();
  const dialogs = useDialogs();

  const { data: dbfilename = "web-logbook.sql" } = useQuery({
    queryKey: ['db', 'filename'],
    queryFn: ({ signal }) => fetchDBFileName({ signal, navigate }),
    staleTime: 86400000,
    gcTime: 86400000,
    refetchOnWindowFocus: false,
  })
  const fileExtension = useMemo(() => (`.${dbfilename.split(".").pop()}`), [dbfilename])

  const { mutateAsync: uploadDB, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async ({ data }) => await uploadDBFile({ payload: data, navigate }),
    onSuccess: async () => {
      // invalidate all cached queries
      await queryClient.invalidateQueries();
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to upload databse' });
  useSuccessNotification({ isSuccess, message: 'Database uploaded' });

  const onFileChange = useCallback(async (event) => {
    const file = event.target.files[0]
    if (file) {
      const confirmed = await dialogs.confirm('Are you sure you want to upload a new database file? All data will be replaced!', {
        title: 'Upload a New Database',
        severity: 'error',
        okText: 'Yes, continue, I have a backup',
        cancelText: 'Arrr, no',
      });

      if (confirmed) {
        const formData = new FormData();
        formData.append('dbfile', file);
        await uploadDB({ data: formData });
      }
    }
    handleCloseMenu();
  }, [uploadDB]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} component="label" disabled={isPending}>
      <input hidden type="file" name="document" id="document" onChange={onFileChange} accept={fileExtension} />
      <CloudUploadOutlinedIcon color="action" sx={{ m: 1 }} />{isPending && <CircularProgress size={24} />}Upload Database
    </MenuItem>
  )
}

export default DBUploadButton;