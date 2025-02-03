import { useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';

export const LogbookSignature = ({ settings, handleChange }) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const penColor = settings?.penColor || '#000000'; // Default color: black

  useEffect(() => {
    const canvas = canvasRef.current;
    signaturePadRef.current = new SignaturePad(canvas, { penColor });

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      signaturePadRef.current.clear(); // Otherwise, isEmpty() might return incorrect value
    };

    // Initial resize
    resizeCanvas();

    // Load existing signature if available
    if (settings.signature_image) {
      signaturePadRef.current.fromDataURL(settings.signature_image);
    }

    window.addEventListener('resize', resizeCanvas);
    signaturePadRef.current.addEventListener("endStroke", handleSave);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current.removeEventListener("endStroke", handleSave);
      }
    };
  }, [settings.signature_image]);

  // Update pen color when user selects a new color
  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.penColor = settings.penColor;
    }
  }, [settings.penColor]);

  const handleSave = () => {
    if (signaturePadRef.current?.isEmpty()) {
      return;
    }
    const dataUrl = signaturePadRef.current.toDataURL();
    handleChange('signature_image', dataUrl);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #ccc', width: '100%', height: '150px' }}
      />
    </>
  );
};

export default LogbookSignature;
