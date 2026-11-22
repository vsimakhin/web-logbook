import { useMutation } from "@tanstack/react-query";
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from "@mui/material/CircularProgress";
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useErrorNotification, useSuccessNotification } from "../../../../hooks/useAppNotifications";
import { queryClient } from "../../../../util/http/http";
import { useDialogs } from '../../../../hooks/useDialogs/useDialogs';
import { updateUserProfile } from "../../../../util/http/settings";

const readJSONFile = async (file) => {
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON');
  }
};

export const ProfileUploadButton = ({ handleCloseMenu }) => {
  const dialogs = useDialogs();

  const { mutateAsync: uploadProfile, isError, error, isSuccess, isPending } = useMutation({
    mutationFn: async (file) => {
      const profile = await readJSONFile(file);
      return updateUserProfile({ settings: profile });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings'] }),
      ]);
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to upload profile' });
  useSuccessNotification({ isSuccess, message: 'Profile uploaded' });

  const onFileChange = async (event) => {
    const input = event.target;
    const file = input.files[0];
    if (file) {
      const confirmed = await dialogs.confirm('Are you sure you want to upload a new profile?', {
        title: 'Upload a profile',
        severity: 'error',
        okText: 'Yes, continue, I have a backup',
        cancelText: 'Arrr, no',
      });

      if (confirmed) {
        try {
          await uploadProfile(file);
        } catch {
          // error is surfaced by useErrorNotification
        }
      }
    }
    input.value = ''; // allow re-selecting the same file
    handleCloseMenu();
  };

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} component="label" disabled={isPending}>
      <input hidden type="file" onChange={onFileChange} accept=".json,application/json" />
      <CloudUploadOutlinedIcon color="action" sx={{ m: 1 }} />Upload Profile&nbsp;
      {isPending && <CircularProgress size={20} />}
    </MenuItem>
  );
};

export default ProfileUploadButton;