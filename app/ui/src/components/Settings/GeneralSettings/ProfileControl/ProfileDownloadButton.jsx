import MenuItem from '@mui/material/MenuItem';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';

const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const ProfileDownloadButton = ({ settings, handleCloseMenu }) => {

  const handleDownload = () => {
    // clean up settings from sensitive data before download
    const {
      /* eslint-disable no-unused-vars */
      owner_name,
      address,
      license_number,
      signature_image,
      aircraft_classes,
      auth_enabled,
      login,
      password,
      secret_key,
      hash,
      previous_experience,
      airports_db_source,
      no_icao_filter,
      ...profile
    } = settings;

    downloadJSON(profile, "web-logbook-profile.json");
    handleCloseMenu();
  };

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleDownload} disabled={!settings}>
      <CloudDownloadOutlinedIcon color="action" sx={{ m: 1 }} /> Download Profile
    </MenuItem>
  );
};

export default ProfileDownloadButton;