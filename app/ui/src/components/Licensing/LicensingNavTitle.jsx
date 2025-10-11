import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
// MUI
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
// Custom
import useSettings from "../../hooks/useSettings";
import { fetchLicenses } from "../../util/http/licensing";
import { calculateExpiry } from "./helpers";

export const LicensingNavTitle = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const { data: licenses = [] } = useQuery({
    queryKey: ["licensing"],
    queryFn: ({ signal }) => fetchLicenses({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });

  const { warning, expired } = useMemo(() => {
    const cfg = settings?.licenses_expiration;
    if (!cfg?.show_warning && !cfg?.show_expired) {
      return { warning: 0, expired: 0 };
    }

    const warningPeriod = cfg.warning_period || 90;
    let warning = 0;
    let expired = 0;

    for (const license of licenses) {
      const expiration = calculateExpiry(license.valid_until || "");
      if (!expiration) continue;

      if (expiration.diffDays < 0) expired++;
      else if (expiration.diffDays < warningPeriod) warning++;
    }

    return { warning, expired };
  }, [licenses, settings?.licenses_expiration]);

  const showWarning = settings?.licenses_expiration?.show_warning;
  const showExpired = settings?.licenses_expiration?.show_expired;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography>Licensing</Typography>

      {showWarning && warning > 0 && (
        <Tooltip title={`${warning} license${warning > 1 ? "s" : ""} expiring soon`}>
          <Chip size="small" label={warning} color="warning" variant="outlined" />
        </Tooltip>
      )}

      {showExpired && expired > 0 && (
        <Tooltip title={`${expired} expired license${expired > 1 ? "s" : ""}`}>
          <Chip size="small" label={expired} color="error" variant="outlined" />
        </Tooltip>
      )}
    </Box>
  );
};
