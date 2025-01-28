import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { createLicenseRecord, updateLicenseRecord } from "../../util/http/licensing";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";

export const SaveLicenseRecordButton = ({ license }) => {
  const navigate = useNavigate();

  const { mutateAsync: saveLicenseRecord, isError, error, isSuccess } = useMutation({
    mutationFn: async ({ payload }) => {
      if (license.uuid === "new") {
        return await createLicenseRecord({ payload, navigate });
      } else {
        return await updateLicenseRecord({ uuid: license.uuid, payload, navigate });
      }
    },
    onSuccess: async ({ data }) => {
      if (license.uuid === "new") {
        navigate(`/licensing/${data}`);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["licensing"] })
        await queryClient.invalidateQueries({ queryKey: ["license", license.id] })
      }
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to save license record" });
  useSuccessNotification({ isSuccess, message: "License record saved" });

  const handleLicenseRecordSave = async () => {
    const formData = new FormData();
    formData.append("uuid", license.uuid);
    formData.append("number", license.number);
    formData.append("name", license.name);
    formData.append("issued", license.issued);
    formData.append("valid_from", license.valid_from);
    formData.append("category", license.category);
    formData.append("valid_until", license.valid_until);
    formData.append("document_name", license.document_name);
    formData.append("document", license.document);
    formData.append("remarks", license.remarks);

    await saveLicenseRecord({ payload: formData });
  }

  return (
    <>
      <Tooltip title="Save license record">
        <IconButton size="small" onClick={() => handleLicenseRecordSave()}><SaveOutlinedIcon /></IconButton>
      </Tooltip>
    </>
  );
}

export default SaveLicenseRecordButton;