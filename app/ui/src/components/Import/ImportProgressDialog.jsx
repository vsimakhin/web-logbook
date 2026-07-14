import { useState, useEffect, useRef } from 'react';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
// Custom helpers
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../../util/auth';

const ImportProgressDialog = ({ open, onClose, payload }) => {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const logEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (open) {
      startImport();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startImport = async () => {
    setStatus('running');
    setProgress({ current: 0, total: payload?.data?.length || 0 });
    setLogs([]);
    setErrorMessage('');
    setResultMessage('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/import/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to import: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line);
              handleProgressChunk(chunk);
            } catch (e) {
              console.error('Error parsing line:', line, e);
            }
          }
        }
      }

      // Parse remaining buffer
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer);
          handleProgressChunk(chunk);
        } catch (e) {
          console.error('Error parsing final buffer line:', buffer, e);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setStatus('error');
        setErrorMessage(err.message || 'An error occurred during import');
      }
    }
  };

  const handleProgressChunk = (chunk) => {
    if (chunk.type === 'log') {
      setProgress({ current: chunk.current, total: chunk.total });
      if (chunk.message) {
        setLogs((prev) => [...prev, chunk.message]);
      }
    } else if (chunk.type === 'result') {
      setProgress({ current: chunk.current, total: chunk.total });
      setStatus(chunk.ok ? 'success' : 'error');
      setResultMessage(chunk.message);
      if (chunk.data) {
        try {
          const finalLogs = JSON.parse(chunk.data);
          if (Array.isArray(finalLogs)) {
            setLogs(finalLogs);
          }
        } catch (e) {
          console.error('Error parsing final data logs:', e);
        }
      }
    }
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={() => status !== 'running' && onClose(status === 'success')}>
      <DialogTitle>Importing Flight Records</DialogTitle>
      <DialogContent>
        {status === 'running' && (
          <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Processing {progress.current} of {progress.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progressPercent)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progressPercent} />
          </Box>
        )}

        {status === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {resultMessage || `Successfully imported all flight records!`}
          </Alert>
        )}

        {status === 'error' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {resultMessage || errorMessage || `Import completed with warnings or failed.`}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Import Log
        </Typography>
        <Box
          sx={{
            bgcolor: 'grey.900',
            color: 'grey.100',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            p: 2,
            borderRadius: 1,
            height: '240px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {logs.length === 0 ? (
            <Typography variant="caption" sx={{ color: 'grey.500', fontStyle: 'italic' }}>
              Waiting for progress...
            </Typography>
          ) : (
            logs.map((item, index) => (
              <Box key={index} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {item}
              </Box>
            ))
          )}
          <div ref={logEndRef} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => onClose(status === 'success')}
          disabled={status === 'running'}
          variant="contained"
          color="primary"
        >
          {status === 'running' ? 'Importing...' : 'Ok'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportProgressDialog;
