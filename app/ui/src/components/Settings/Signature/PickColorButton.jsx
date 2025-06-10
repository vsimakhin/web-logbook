import { useRef } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// Icon
import ColorizeOutlinedIcon from "@mui/icons-material/ColorizeOutlined";

export const PickColorButton = ({ handleChange }) => {
  const colorInputRef = useRef(null);

  const handleColorChange = (event) => {
    handleChange("penColor", event.target.value);
  };

  return (
    <>
      <Tooltip title="Pick Signature Color">
        <IconButton size="small" onClick={() => colorInputRef.current.click()}>
          <ColorizeOutlinedIcon />
        </IconButton>
      </Tooltip>
      <input
        ref={colorInputRef}
        type="color"
        onChange={handleColorChange}
        style={{ display: "none" }} // Hide the input
      />
    </>
  );
};

export default PickColorButton;