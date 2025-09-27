import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
// MUI UI elements
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchAttachments } from "../../util/http/attachment";
import Attachment from "./Attachment";
import AddAttachmentButton from "./AddAttachmentButton";
import AddTrackButton from "./AddTrackButton";

export const Attachments = ({ id }) => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attachments', id],
    queryFn: ({ signal }) => fetchAttachments({ signal, id, navigate }),
    enabled: !(id === "new"),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load attachments' });

  const ActionButtons = memo(({ id }) => (
    <>
      <AddTrackButton id={id} />
      <AddAttachmentButton id={id} />
    </>
  ));

  return (
    <>
      {isLoading && <LinearProgress />}
      {id !== "new" &&
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <CardHeader title="Attachments" action={<ActionButtons id={id} />} />
            {data && data.map((attachment) => (
              <Attachment key={attachment.uuid} attachment={attachment} />
            ))}
          </CardContent>
        </Card >
      }
    </>
  );
}

export default Attachments;