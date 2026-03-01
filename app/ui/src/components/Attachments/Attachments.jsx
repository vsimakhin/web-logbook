import { useQuery } from '@tanstack/react-query';
// MUI
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import { useErrorNotification } from '../../hooks/useAppNotifications';
import { fetchAttachments } from '../../util/http/attachment';

export const Attachments = () => {
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
        {JSON.stringify(attachments)}
      </Grid>

      <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
        {"quick preview"}
      </Grid>
    </Grid>
  );
}

export default Attachments;