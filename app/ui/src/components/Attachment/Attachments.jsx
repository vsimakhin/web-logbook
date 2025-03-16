import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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

export const Attachments = ({ id }) => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attachments', id],
    queryFn: ({ signal }) => fetchAttachments({ signal, id, navigate }),
    enabled: !(id === "new"),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load attachments' });

  return (
    <>
      {isLoading && <LinearProgress />}
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <CardHeader title="Attachments"
            action={<AddAttachmentButton id={id} />}
          />
          {data && data.map((attachment) => (
            <Attachment key={attachment.uuid} attachment={attachment} />
          ))}
        </CardContent>
      </Card >
    </>
  );
}

export default Attachments;