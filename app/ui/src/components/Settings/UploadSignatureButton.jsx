// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// Icon
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

export const UploadSignatureButton = ({ handleChange }) => {

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/png') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        handleChange('signature_image', base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <>
      <Tooltip title="Upload Signature">
        <IconButton component="label">
          <CloudUploadOutlinedIcon />
          <input
            hidden
            type="file"
            accept="image/png"
            onChange={handleFileUpload}
          />
        </IconButton>
      </Tooltip>
    </>
  );
}

export default UploadSignatureButton;