// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

const ImportLogDialog = ({ open, onClose, payload }) => {
  // check if payload.data exists and parse it
  let data = [];
  if (payload.data) {
    data = JSON.parse(payload.data);
  }
  return (
    <Dialog fullWidth open={open} onClose={() => onClose(null)}>
      <DialogTitle>Import Log</DialogTitle>
      <DialogContent>
        <Alert severity={payload.ok === true ? "success" : "warning"} >{payload.message}</Alert>
        {!payload.ok && <Divider sx={{ m: 2 }} />}
        <ol>
          {data.map((item, index) => (<Box key={index} component="li">{item}</Box>))}
        </ol>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImportLogDialog;