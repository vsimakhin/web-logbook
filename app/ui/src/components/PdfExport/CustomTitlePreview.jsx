import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from 'react';
import { fileTypeFromBuffer } from 'file-type';
// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { fetchAttachment } from "../../util/http/attachment";
import { useErrorNotification } from "../../hooks/useAppNotifications";

const decodeBase64 = async (base64String) => {
  const binaryString = atob(base64String);
  const uint8Array = new Uint8Array(
    binaryString.split('').map((char) => char.charCodeAt(0))
  );

  const fileType = await fileTypeFromBuffer(uint8Array);
  return fileType?.mime || 'application/pdf';
};

export const CustomTitlePreview = ({ format }) => {
  const id = `custom_title_${format.toLowerCase()}`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['custom-title', format],
    queryFn: ({ signal }) => fetchAttachment({ id, signal }),
    placeholderData: { document: null },
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to custom title page' });

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const loadDocument = async () => {
      if (!data?.document) {
        setPreviewUrl(null);
        return;
      }

      if (data.document instanceof File) {
        // Handle File type (user-selected file)
        const file = data.document;
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file); // Generate data URL for the file
        });
        setPreviewUrl(dataUrl);
      } else {
        // Handle base64-encoded document
        const mimeType = await decodeBase64(data.document);
        const dataUrl = `data:${mimeType};base64,${data.document}`;
        setPreviewUrl(dataUrl);
      }
    };

    loadDocument();
  }, [data?.document]);

  const renderPreview = () => {
    if (!data.document) {
      return <p>No document attached</p>;
    }

    return (
      <iframe
        src={previewUrl}
        title="Document Preview"
        style={{ width: "100%", height: window.innerHeight - 200, border: "none" }}
      />
    );
  };

  return (
    <>
      {isLoading && <LinearProgress />}
      {renderPreview()}
    </>
  );
}

export default CustomTitlePreview;