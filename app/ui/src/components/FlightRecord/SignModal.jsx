import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import SignaturePad from 'signature_pad';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import LinearProgress from '@mui/material/LinearProgress';
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import ColorizeOutlinedIcon from "@mui/icons-material/ColorizeOutlined";
// Custom
import CardHeader from "../UIElements/CardHeader";
import { fetchFlightRecordSignature, updateFlightRecordSignature } from '../../util/http/logbook';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import { queryClient } from '../../util/http/http';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const SaveButton = ({ onClose, uuid, signature }) => {
  const { mutateAsync, isError, error } = useMutation({
    mutationFn: () => updateFlightRecordSignature({ id: uuid, signature }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight', uuid, 'signature'] });
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to update flight record signature' });

  const handleOnClick = useCallback(async () => {
    await mutateAsync();
    onClose();
  }, [mutateAsync, onClose]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

const ClearSignatureButton = ({ setSignature }) => {
  return (
    <Tooltip title="Clear Signature">
      <IconButton size="small" onClick={() => setSignature('')}     >
        <CleaningServicesOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

const PickColorButton = ({ setPenColor }) => {
  const colorInputRef = useRef(null);
  const handleColorChange = useCallback((event) => { setPenColor(event.target.value) }, [setPenColor]);

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

const ActionButtons = ({ onClose, uuid, signature, setSignature, setPenColor }) => (
  <>
    <PickColorButton setPenColor={setPenColor} />
    <ClearSignatureButton setSignature={setSignature} />
    <SaveButton onClose={onClose} uuid={uuid} signature={signature} />
    <CloseDialogButton onClose={onClose} />
  </>
);

export const SignModal = ({ open, onClose, payload }) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [penColor, setPenColor] = useState('#000000'); // Default color: black
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
    const timer = setTimeout(() => { initSignaturePad() }, 100);

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
          <CardHeader title={"Signature"}
            action={<ActionButtons onClose={onClose} uuid={payload.uuid} signature={signature} setSignature={setSignature} setPenColor={setPenColor} />} />
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