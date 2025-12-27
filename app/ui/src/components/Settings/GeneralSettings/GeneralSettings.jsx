// MUI UI elements
import Divider from "@mui/material/Divider";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../../UIElements/CardHeader";
import SaveSettingsButton from "../SaveSettingsButton";
import OwnerInfoFields from "./OwnerInfoFields";
import OtherSettings from "./OtherSettings";
import AuthSettings from "./AuthSettings";
import LicensesExpiration from "./LicensesExpiration";
import DBActionsMenu from "./DBControl/DBActionsMenu";
import HelpButton from "./HelpButton";

const ActionButtons = ({ settings }) => (
  <>
    <HelpButton />
    <DBActionsMenu />
    <SaveSettingsButton settings={settings} />
  </>
);

export const GeneralSettings = ({ settings, handleChange }) => {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Settings" action={<ActionButtons settings={settings} />} />

        <OwnerInfoFields settings={settings} handleChange={handleChange} />
        <Divider sx={{ m: 1 }} />
        <OtherSettings settings={settings} handleChange={handleChange} />
        <LicensesExpiration settings={settings} handleChange={handleChange} />
        <Divider sx={{ m: 1 }} />
        <AuthSettings settings={settings} handleChange={handleChange} />
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;