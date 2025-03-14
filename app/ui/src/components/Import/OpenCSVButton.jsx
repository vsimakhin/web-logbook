import Papa from 'papaparse';
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// Custom components
import MapFieldsDialog from "./MapFieldsDialog";
import { autoTimeRecog, convertToDDMMYYYY } from './helpers';

export const OpenCSVButton = ({ setData }) => {
  const dialogs = useDialogs();

  const handleFileChange = async (event) => {
    for (const file of event.target.files) {
      if (file) {
        Papa.parse(file, {
          complete: async function (results) {
            if (results.errors.length) {
              await dialogs.alert("Something went wrong when parsing the file");
            }
            else {
              const payload = results.data[0];
              const mapped = await dialogs.open(MapFieldsDialog, payload);

              if (mapped) {
                const data = results.data.slice(1).map((row) => {
                  const newRow = {};
                  for (const key in mapped) {
                    newRow[key] = row[payload.indexOf(mapped[key])];
                  }

                  if (newRow["date"] === undefined || newRow["date"] === "") {
                    return null;
                  }

                  // some formatting
                  newRow["date"] = convertToDDMMYYYY(newRow["date"]);
                  newRow["departure_time"] = autoTimeRecog(newRow["departure_time"]);
                  newRow["arrival_time"] = autoTimeRecog(newRow["arrival_time"]);

                  return newRow;
                }).filter(row => row !== null);

                setData(data);
              }
            }
          }
        });
      }
    }
  };

  return (
    <>
      <Tooltip title="Open CSV for import">
        <IconButton size="small" component="label" ><AddBoxOutlinedIcon />
          <input hidden type="file" name="document" id="document" onChange={handleFileChange}
            accept=".csv, text/csv, application/csv, text/comma-separated-values" />
        </IconButton>
      </Tooltip>
    </>
  );
}

export default OpenCSVButton;