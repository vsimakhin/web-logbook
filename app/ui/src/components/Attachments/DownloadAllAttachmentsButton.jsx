import { useCallback } from 'react';
import { ToolbarButton } from '@mui/x-data-grid';
import { useMutation } from '@tanstack/react-query';
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI
import Tooltip from '@mui/material/Tooltip';
// MUI Icon
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import { downloadAttachments } from '../../util/http/attachment';


export const DownloadAllAttachmentsButton = ({ filteredRows }) => {
  const dialogs = useDialogs();
  const disabled = !filteredRows || filteredRows.length === 0;

  const { mutateAsync: downloadAttachmentsMutation } = useMutation({
    mutationFn: ({ payload }) => downloadAttachments({ payload }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "attachments.zip"; // you can make this dynamic
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    },
  });

  const handleDownloadAll = useCallback(async () => {
    const status = await dialogs.confirm(`Would you like to download ${filteredRows.length} attachments?`, {
      title: 'Download attachments',
      severity: 'warning',
      okText: 'Download'
    });

    if (!status) {
      return;
    }

    const ids = filteredRows.map((row) => row.uuid);
    const payload = { ids: ids };

    await downloadAttachmentsMutation({ payload });
  }, [downloadAttachmentsMutation, filteredRows, dialogs]);


  return (
    <Tooltip title="Download all/filtered attachments">
      <div>
        <ToolbarButton disabled={disabled} onClick={handleDownloadAll} color="default" label='Download all/filtered attachments'>
          <CloudDownloadOutlinedIcon />
        </ToolbarButton>
      </div>
    </Tooltip>
  );
};

export default DownloadAllAttachmentsButton;
