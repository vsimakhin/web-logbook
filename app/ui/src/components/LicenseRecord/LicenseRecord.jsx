import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom components and libraries
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLicense } from "../../util/http/licensing";
import { LICENSE_INITIAL_STATE } from "../../constants/constants";
import CardHeader from "../UIElements/CardHeader";
import LicenseRecordDetails from "./LicenseRecordDetails";
import LicensePreview from "./LicensePreview";
import SaveLicenseRecordButton from "./SaveLicenseRecordButton";

export const LicenseRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [license, setLicense] = useState({ ...LICENSE_INITIAL_STATE, uuid: id });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['license', id],
    queryFn: ({ signal }) => fetchLicense({ signal, id, navigate }),
    enabled: license.id !== "new",
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load flight record' });

  useEffect(() => {
    if (data) {
      setLicense(data);
    }
  }, [data]);

  const handleChange = (key, value) => {
    setLicense(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="License & Certification Record"
                action={
                  <>
                    {/* <HelpButton /> */}
                    <SaveLicenseRecordButton license={license} />
                    {/* Delete button */}
                    {/* Delete attachment button */}
                  </>
                }
              />
              <LicenseRecordDetails license={license} handleChange={handleChange} />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <LicensePreview license={license} />
        </Grid>
      </Grid>
    </>
  );
}

export default LicenseRecord;