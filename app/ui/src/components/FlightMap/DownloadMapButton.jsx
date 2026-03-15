import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export const DownloadMapButton = ({ map }) => {

  const handleExportMap = useCallback(() => {
    if (!map) return;

    map.once('rendercomplete', () => {
      const size = map.getSize();
      if (!size) return;

      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];

      const mapContext = mapCanvas.getContext('2d');
      if (!mapContext) return;

      const canvases = map.getViewport().getElementsByTagName('canvas');

      Array.from(canvases).forEach((canvas) => {
        if (!canvas.width) return;

        const opacity = canvas.parentNode?.style.opacity ?? canvas.style.opacity ?? 1;
        mapContext.globalAlpha = Number(opacity) || 1;

        let matrix;
        const transform = canvas.style.transform;

        if (transform) {
          const match = transform.match(/^matrix\((.*)\)$/);
          if (match) {
            matrix = match[1].split(',').map(Number);
          }
        }

        if (!matrix) {
          matrix = [
            canvas.width / mapCanvas.width, 0, 0,
            canvas.height / mapCanvas.height, 0, 0,
          ];
        }

        mapContext.setTransform(...matrix);

        const backgroundColor = canvas.parentNode?.style.backgroundColor;
        if (backgroundColor) {
          mapContext.fillStyle = backgroundColor;
          mapContext.fillRect(0, 0, canvas.width, canvas.height);
        }

        mapContext.drawImage(canvas, 0, 0);
      });

      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);

      mapCanvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'map.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    });

    map.renderSync();
  }, [map]);

  return (
    <Tooltip title="Save Map as PNG">
      <IconButton onClick={handleExportMap} disabled={!map} size="small">
        <FileDownloadIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default DownloadMapButton;
