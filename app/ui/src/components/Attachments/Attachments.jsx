import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
// MUI
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import { useErrorNotification } from '../../hooks/useAppNotifications';
import { fetchAttachments } from '../../util/http/attachment';
import AttachmentsTable from './AttachmentsTable';
import AttachmentPreview from './AttachmentPreview';

export const Attachments = () => {
  const [selectedAttachment, setSelectedAttachment] = useState({});

  const { data: attachments, isLoading, isError, error } = useQuery({
    queryKey: ['attachments'],
    queryFn: ({ signal }) => fetchAttachments({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  })
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load attachments' });

  return (
    <Grid container spacing={1} >
      <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
        {isLoading && <LinearProgress />}
        <AttachmentsTable attachments={attachments} setSelectedAttachment={setSelectedAttachment} />
      </Grid>

      <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
        <AttachmentPreview attachment={selectedAttachment} />
      </Grid>
    </Grid>
  );
}

export default Attachments;