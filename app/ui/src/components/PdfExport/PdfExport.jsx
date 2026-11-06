import { useCallback, useEffect, useState } from "react";
// MUI
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import PageSettings from "./PageSettings";
import OtherSettings from "./OtherSettings";
import CustomTitlePreview from "./CustomTitlePreview";
import PDFPageLayout from "./PDFPageLayout";
import useSettings from "../../hooks/useSettings";

export const PdfExport = ({ format }) => {
  const [pdfSettings, setPdfSettings] = useState({ columns: {}, headers: {} });
  const { data, isLoading } = useSettings();

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      format === "A4" ? setPdfSettings(data.export_a4) : setPdfSettings(data.export_a5);
    }
  }, [data, format]);

  const handleChange = useCallback((path, value) => {
    setPdfSettings((prev) => {
      const keys = path.split('.');
      const next = { ...prev };
      let current = next;
      let previous = prev;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...(previous[key] ?? {}) };
        current = current[key];
        previous = previous[key] ?? {};
      }

      current[keys[keys.length - 1]] = value;

      return next;
    });
  }, []);

  if (isLoading || !pdfSettings) return <LinearProgress />

  return (
    <Grid container spacing={1} >
      <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
        <PageSettings format={format} pdfSettings={pdfSettings} handleChange={handleChange} />
        <PDFPageLayout settings={pdfSettings} handleChange={handleChange} format={format} />
      </Grid>

      <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
        <CustomTitlePreview format={format} />
        <OtherSettings pdfSettings={pdfSettings} format={format} handleChange={handleChange} />
      </Grid>
    </Grid>
  );
}

export default PdfExport;