import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SignaturePad from 'signature_pad';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid2";
import LinearProgress from '@mui/material/LinearProgress';
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
// Custom
import CardHeader from "../UIElements/CardHeader";
import { fetchFlightRecordSignature } from '../../util/http/logbook';
import { useErrorNotification } from '../../hooks/useAppNotifications';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const SaveButton = ({ onClose, signature }) => {

  const handleOnClick = useCallback(async () => {
    console.log(signature);
    // await mutateAsync();
    onClose();
  }, [onClose, signature]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

const ActionButtons = ({ onClose, signature }) => (
  <>
    <SaveButton onClose={onClose} signature={signature} />
    <CloseDialogButton onClose={onClose} />
  </>
);

export const SignModal = ({ open, onClose, payload }) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const penColor = '#000000'; // Default color: black
  const [signature, setSignature] = useState('');

  const { data, error: signatureError, isLoading: signatureLoading } = useQuery({
    queryKey: ['flight', payload.uuid, 'signature'],
    queryFn: () => fetchFlightRecordSignature({ id: payload.uuid }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  })
  useErrorNotification({ isError: signatureError, error: signatureError, fallbackMessage: 'Failed to load flight record signature' });

  const handleSave = useCallback(() => {
    if (signaturePadRef.current?.isEmpty()) {
      return;
    }
    const dataUrl = signaturePadRef.current.toDataURL();
    setSignature(dataUrl);
  }, []);

  useEffect(() => {
    let animationFrameId;

    const initSignaturePad = () => {
      const canvas = canvasRef.current;
      if (!canvas || !open) {
        return;
      }

      // If dimensions are 0, try again in the next frame
      if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
        animationFrameId = requestAnimationFrame(initSignaturePad);
        return;
      }

      if (!signaturePadRef.current) {
        signaturePadRef.current = new SignaturePad(canvas, { penColor });
        signaturePadRef.current.addEventListener("endStroke", handleSave);
      }

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);

      signaturePadRef.current.clear();
      if (signature) {
        signaturePadRef.current.fromDataURL(signature);
      }
    };

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas && signaturePadRef.current) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);

        signaturePadRef.current.clear();
        if (signature) {
          signaturePadRef.current.fromDataURL(signature);
        }
      }
    };

    // Wait for the dialog transition to complete a bit more reliably
    const timer = setTimeout(() => {
      initSignaturePad();
    }, 100);

    window.addEventListener('resize', resizeCanvas);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current.removeEventListener("endStroke", handleSave);
        signaturePadRef.current = null;
      }
    };
  }, [handleSave, penColor, open, signature]);

  // Initial loading from query data
  useEffect(() => {
    if (data) {
      setSignature(data); // eslint-disable-line react-hooks/set-state-in-effect
      if (signaturePadRef.current) {
        signaturePadRef.current.fromDataURL(data);
      }
    }
  }, [data]);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title={"Signature"} action={<ActionButtons onClose={onClose} signature={signature} />} />
          {signatureLoading && <LinearProgress />}
          <Grid container spacing={1}>
            <canvas
              ref={canvasRef}
              style={{ border: '1px solid #ccc', width: '100%', height: '150px' }}
            />
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  )
}

export default SignModal;