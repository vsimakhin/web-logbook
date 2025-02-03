import { useEffect, useState } from 'react';
import { fileTypeFromBuffer } from 'file-type';
// MUI UI elements
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom components and libraries
import CardHeader from '../UIElements/CardHeader';

export const decodeBase64 = async (base64String) => {
  const binaryString = atob(base64String);
  const uint8Array = new Uint8Array(
    binaryString.split('').map((char) => char.charCodeAt(0))
  );

  const fileType = await fileTypeFromBuffer(uint8Array);
  return fileType?.mime || 'unknown';
};

export const LicensePreview = ({ license }) => {
  const [fileType, setFileType] = useState("unknown");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const loadDocument = async () => {
      if (!license?.document) {
        setFileType("unknown");
        setPreviewUrl(null);
        return;
      }

      if (license.document instanceof File) {
        // Handle File type (user-selected file)
        const file = license.document;
        const mimeType = file.type || "unknown"; // Get the MIME type from the file
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file); // Generate data URL for the file
        });
        setFileType(mimeType);
        setPreviewUrl(dataUrl);
      } else {
        // Handle base64-encoded document
        const mimeType = await decodeBase64(license.document);
        const dataUrl = `data:${mimeType};base64,${license.document}`;
        setFileType(mimeType);
        setPreviewUrl(dataUrl);
      }
    };

    loadDocument();
  }, [license?.document]);

  const renderPreview = () => {
    if (!license.document) {
      return <p>No document attached</p>;
    }

    if (fileType.startsWith("image/")) {
      return (
        <img
          src={previewUrl}
          alt="Document Preview"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      );
    } else if (fileType === "application/pdf") {
      return (
        <iframe
          src={previewUrl}
          title="Document Preview"
          style={{ width: "100%", height: window.innerHeight - 200, border: "none" }}
        />
      );
    } else {
      return <p>Preview not available for this file type: {fileType}</p>;
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <CardHeader title="License Record Preview" />
        {renderPreview()}
      </CardContent>
    </Card>
  );
};


export default LicensePreview;