import { useMemo } from "react";
import dayjs from "dayjs";
// MUI
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
// Custom
import useSettings from "../../hooks/useSettings";
import { calculateExpiry } from "./helpers";
import { useLicensingQuery } from "../../hooks/queries";

export const LicensingNavTitle = () => {
  const { settings } = useSettings();
  const { data: licenses = [] } = useLicensingQuery();

  const { warning, expired } = useMemo(() => {
    const cfg = settings?.licenses_expiration;
    if (!cfg?.show_warning && !cfg?.show_expired) {
      return { warning: 0, expired: 0 };
    }

    const warningPeriod = cfg.warning_period || 90;
    let warning = 0;
    let expired = 0;

    if (licenses) {
      for (const license of licenses) {
        const expiration = calculateExpiry(dayjs(license.valid_until) || null);
        if (!expiration) continue;

        if (expiration.diffDays < 0) expired++;
        else if (expiration.diffDays < warningPeriod) warning++;
      }
    }

    return { warning, expired };
  }, [licenses, settings?.licenses_expiration]);

  const showWarning = settings?.licenses_expiration?.show_warning;
  const showExpired = settings?.licenses_expiration?.show_expired;

  return (
    <>
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
    </>
  );
};

export default LicensingNavTitle;