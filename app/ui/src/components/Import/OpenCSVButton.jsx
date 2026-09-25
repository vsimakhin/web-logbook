import Papa from 'papaparse';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// Custom components
import MapFieldsDialog from "./MapFieldsDialog";
import { autoDepArrTimeRecog, autoTimeFieldRecog, convertToDDMMYYYY, marshallItem } from './helpers';
import { ToolbarButton } from '@mui/x-data-grid';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';

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
              const headers = results.data[0];
              const mapped = await dialogs.open(MapFieldsDialog, headers);

              if (mapped) {
                const picSelf = mapped.pic_self_replace?.toLowerCase().trim();
                let generatedId = 0;
                const data = results.data.slice(1).map((row) => {
                  const newRow = {};

                  newRow.generated_id = generatedId++;
                  for (const key in mapped) {
                    newRow[key] = row[headers.indexOf(mapped[key])];
                  }

                  if (!newRow.date) {
                    return null;
                  }

                  // some formatting
                  newRow.date = convertToDDMMYYYY(newRow.date);
                  newRow.departure_time = autoDepArrTimeRecog(newRow.departure_time);
                  newRow.arrival_time = autoDepArrTimeRecog(newRow.arrival_time);

                  // autorecognize the routing if it's in format XXXX-YYYY and set for departure place
                  if (newRow.departure_place.includes("-")) {
                    const normalized = newRow.departure_place.toUpperCase().trim();
                    const [departure, arrival] = normalized.split("-");
                    newRow.departure_place = departure.trim();
                    newRow.arrival_place = arrival.trim();
                  }

                  // time fields
                  newRow.se_time = autoTimeFieldRecog(newRow.se_time);
                  newRow.me_time = autoTimeFieldRecog(newRow.me_time);
                  newRow.mcc_time = autoTimeFieldRecog(newRow.mcc_time);
                  newRow.total_time = autoTimeFieldRecog(newRow.total_time);
                  newRow.night_time = autoTimeFieldRecog(newRow.night_time);
                  newRow.ifr_time = autoTimeFieldRecog(newRow.ifr_time);
                  newRow.pic_time = autoTimeFieldRecog(newRow.pic_time);
                  newRow.co_pilot_time = autoTimeFieldRecog(newRow.co_pilot_time);
                  newRow.dual_time = autoTimeFieldRecog(newRow.dual_time);
                  newRow.instructor_time = autoTimeFieldRecog(newRow.instructor_time);
                  newRow.sim_time = autoTimeFieldRecog(newRow.sim_time);

                  // replace pic name with self if needed
                  if (newRow.pic_name?.toLowerCase().trim() === picSelf) newRow.pic_name = "Self";

                  // replace tags delimiters with commas
                  if (newRow.tags) {
                    newRow.tags = newRow.tags.replace(/[;|]/g, ",");
                  }

                  return newRow;
                }).filter(row => row !== null);

                const convertedData = [];
                for (const item of data) {
                  convertedData.push(marshallItem(item));
                }
                setData(convertedData);
              }
            }
          }
        });
      }
    }
  };

  return (
    <Tooltip title="Open CSV for import">
      <ToolbarButton color="default" label="Open CSV" component="label" ><AddBoxOutlinedIcon />
        <input hidden type="file" name="document" id="document" onChange={handleFileChange}
          accept=".csv, text/csv, application/csv, text/comma-separated-values" />
      </ToolbarButton>
    </Tooltip>
  );
}

export default OpenCSVButton;