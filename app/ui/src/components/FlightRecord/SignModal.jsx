import { useCallback, useMemo } from 'react';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid2";
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
// Custom
import CardHeader from "../UIElements/CardHeader";


const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const SaveButton = ({ onClose }) => {


  const handleOnClick = useCallback(async () => {
    // await mutateAsync();
    onClose();
  }, [onClose]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

export const SignModal = ({ open, onClose, payload }) => {

  const actionButtons = useMemo(() => (
    <>
      <SaveButton onClose={onClose} />
      <CloseDialogButton onClose={onClose} />
    </>
  ), [onClose]);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title={"Signature"} action={actionButtons} />
          <Grid container spacing={1}>
            {"Signature field " + payload}
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  )
}

export default SignModal;