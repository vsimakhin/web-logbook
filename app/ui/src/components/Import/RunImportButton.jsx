import { ToolbarButton } from "@mui/x-data-grid";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
// MUI Icons
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
// Custom components
import { queryClient } from "../../util/http/http";
import ImportProgressDialog from "./ImportProgressDialog";
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import ImportOptionsDialog from "./ImportOptionsDialog";

export const RunImportButton = ({ data }) => {
  const dialogs = useDialogs();

  const importData = async (options) => {

    // need to marshal custom fields in the data to the string, since go struct field is string as well
    const marshalledData = data.map((item) => ({
      ...item,
      custom_fields:
        typeof item.custom_fields === "string"
          ? item.custom_fields
          : JSON.stringify(item.custom_fields ?? {}),
    }));

    const payload = {
      options,
      data: marshalledData,
    };

    try {
      const isSuccess = await dialogs.open(ImportProgressDialog, payload);
      if (isSuccess) {
        await queryClient.invalidateQueries();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleImportClick = async () => {
    const options = await dialogs.open(ImportOptionsDialog);
    if (options && options.backup) {
      await importData(options);
    }
  };

  return (
    <Tooltip title="Run Import">
      <span>
        <ToolbarButton disabled={data.length === 0} onClick={handleImportClick} color="default" label="Run Import">
          <FileUploadOutlinedIcon />
        </ToolbarButton>
      </span>
    </Tooltip>
  );
}

export default RunImportButton;