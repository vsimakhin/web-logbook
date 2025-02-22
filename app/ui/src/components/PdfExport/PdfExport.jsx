import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// MUI
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { LinearProgress } from "@mui/material";
// Custom
import CardHeader from "../UIElements/CardHeader";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchSettings } from "../../util/http/settings";
import RestoreDefaultsButton, { SECTION_PAGE_SETTINGS, SECTION_COLUMN_WIDTH, SECTION_COLUMN_HEADER } from "./RestoreDefaultsButton";
import PageSettings from "./PageSettings";
import LogbookColumnWidth from "./LogbookColumnWidth";
import LogbookHeaders from "./LogbookHeaders";

export const PdfExport = ({ format }) => {
  const navigate = useNavigate();
  const [pdfSettings, setPdfSettings] = useState({ columns: {}, headers: {} });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => fetchSettings({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load settings' });

  useEffect(() => {
    if (data) {
      format === "A4" ? setPdfSettings(data.export_a4) : setPdfSettings(data.export_a5);
    }
  }, [data]);

  const handleChange = (key, value) => {
    setPdfSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleColumnChange = (key, value) => {
    setPdfSettings((prev) => ({ ...prev, columns: { ...prev.columns, [key]: value } }));
  }

  const handleHeaderChange = (key, value) => {
    setPdfSettings((prev) => ({ ...prev, headers: { ...prev.headers, [key]: value } }));
  }

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Page Settings" action={
                <>
                  <RestoreDefaultsButton format={format} section={SECTION_PAGE_SETTINGS} handleChange={handleChange} />
                </>
              } />
              <PageSettings format={format} pdfSettings={pdfSettings} handleChange={handleChange} />
            </CardContent>
          </Card >

          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Logbook Columns Width" action={
                <>
                  <RestoreDefaultsButton format={format} section={SECTION_COLUMN_WIDTH} handleChange={handleChange} />
                </>
              } />
              <LogbookColumnWidth format={format} columnSettings={pdfSettings.columns} handleChange={handleColumnChange} />
            </CardContent>
          </Card >

          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Logbook Columns Header" action={
                <>
                  <RestoreDefaultsButton format={format} section={SECTION_COLUMN_HEADER} handleChange={handleChange} />
                </>
              } />
              <LogbookHeaders headerSettings={pdfSettings.headers} handleChange={handleHeaderChange} />
            </CardContent>
          </Card >
        </Grid>
      </Grid>

      <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>

      </Grid>
    </>
  );
}

export default PdfExport;