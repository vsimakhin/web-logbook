// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
// Custom
import HelpButtonDrawer from "../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "Clear table",
    icon: CleaningServicesOutlinedIcon,
    description: "Remove all prepared flight records for import.",
  },
  {
    title: "Open CSV for import",
    icon: AddBoxOutlinedIcon,
    description: "Select a CSV file and open the form for field mapping.",
  },
  {
    title: "Run import",
    icon: FileUploadOutlinedIcon,
    description: "Import the prepared flight records into the logbook.",
  },
  {
    title: "Date field format",
    description: `The standard and preferred format is DD/MM/YYYY.
      The application also recognizes formats like YYYY-MM-DD or DD-MM-YYYY.`,
  },
  {
    title: "Departure and Arrival places format",
    description: `Use ICAO or IATA codes, e.g., LKPR or PRG for Prague Airport.
      If your CSV contains a full route (e.g., LKPR-EDDM), set it in the departure field 
      and leave arrival empty - the application will split it automatically.`,
  },
  {
    title: "Departure and Arrival times format",
    description: `The standard and preferred format is HHMM in Zulu time.
      The application can also recognize times from values like HH:MM 
      or full timestamps such as DD/MM/YYYY HH:MM:SS.`,
  },
  {
    title: "Flight time format",
    description: "Flight time fields must use the HH:MM format.",
  },
];

export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
}

export default HelpButton;