import { fileTypeFromBuffer } from 'file-type';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
// MUI
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import { fetchAttachment } from '../../util/http/attachment';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import CardHeader from '../UIElements/CardHeader';

export const AttachmentPreview = ({ attachment }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [mimeType, setMimeType] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attachments', 'attachment', attachment.uuid],
    queryFn: () => fetchAttachment({ id: attachment.uuid }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: attachment && attachment.uuid !== "",
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load preview', });

  useEffect(() => {
    if (data) {
      const loadAttachment = async () => {
        const binary = atob(data.document);
        const byteArray = Uint8Array.from(binary, char => char.charCodeAt(0));

        // Detect MIME type using file-type
        const fileType = await fileTypeFromBuffer(byteArray);
        const resolvedMime = fileType?.mime || 'application/octet-stream';
        setMimeType(resolvedMime);

        const blob = new Blob([byteArray], { type: resolvedMime });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
      loadAttachment();
    }
  }, [data]); // trigger load

  // Separate effect strictly for blob cleanup
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]); // Only runs when blobUrl changes (or unmounts)

  const renderPreview = () => {
    if (!attachment || !attachment.uuid) {
      return (<Typography>No attachment selected</Typography>);
    }

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
      return (<Typography>No preview available for this file type</Typography>);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title={"Attachment Preview"} />
        {isLoading && <LinearProgress />}
        {!isLoading && blobUrl && mimeType && (
          renderPreview()
        )}
      </CardContent>
    </Card>
  );
};

export default AttachmentPreview;