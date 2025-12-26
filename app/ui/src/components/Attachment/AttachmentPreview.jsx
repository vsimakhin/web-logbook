import { fileTypeFromBuffer } from 'file-type';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
// MUI
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
// Custom
import { fetchAttachment } from '../../util/http/attachment';
import { useErrorNotification } from '../../hooks/useAppNotifications';

export const AttachmentPreview = ({ attachment, open, onClose }) => {
  const navigate = useNavigate();
  const [blobUrl, setBlobUrl] = useState(null);
  const [mimeType, setMimeType] = useState(null);

  const { mutate: loadAttachment, isPending } = useMutation({
    mutationFn: () => fetchAttachment({ id: attachment.uuid, navigate }),
    onSuccess: async (data) => {
      const binary = atob(data.document);
      const byteArray = Uint8Array.from(binary, char => char.charCodeAt(0));

      // Detect MIME type using file-type
      const fileType = await fileTypeFromBuffer(byteArray);
      const resolvedMime = fileType?.mime || 'application/octet-stream';
      setMimeType(resolvedMime);

      const blob = new Blob([byteArray], { type: resolvedMime });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    },
  });
  useErrorNotification({ isError: false, fallbackMessage: 'Failed to load preview', });

  useEffect(() => {
    if (open) {
      loadAttachment();
    }
  }, [open, loadAttachment]); // trigger load

  // Separate effect strictly for blob cleanup
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]); // Only runs when blobUrl changes (or unmounts)

  const renderPreview = () => {
    if (mimeType.startsWith("image/")) {
      return (
        <img src={blobUrl} alt={attachment.document_name} style={{ width: '100%' }} />
      );
    } else if (mimeType === "application/pdf") {
      return (
        <iframe
          src={blobUrl}
          title={attachment.document_name}
          width="100%"
          height={window.innerHeight - 200}
          style={{ border: 'none' }}
        />
      );
    } else {
      return (
        <Typography>
          No preview available for this file type: {mimeType}
        </Typography>
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        {isPending && <LinearProgress />}
        {!isPending && blobUrl && mimeType && (
          renderPreview()
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentPreview;