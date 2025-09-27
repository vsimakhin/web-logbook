import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useNotifications } from "@toolpad/core/useNotifications";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { createLicenseRecord, updateLicenseRecord } from "../../util/http/licensing";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";

export const SaveLicenseRecordButton = ({ license, handleChange }) => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { mutateAsync: saveLicenseRecord, isError, error, isSuccess } = useMutation({
    mutationFn: async ({ payload }) => {
      if (license.uuid === "new") {
        return await createLicenseRecord({ payload, navigate });
      } else {
        return await updateLicenseRecord({ uuid: license.uuid, payload, navigate });
      }
    },
    onSuccess: async (data) => {
      const response = JSON.parse(await data.text());
      if (license.uuid === "new") {
        handleChange("uuid", response.data);
        navigate(`/licensing/${response.data}`);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["license", license.id] })
      }
      await queryClient.invalidateQueries({ queryKey: ["licensing"] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to save license record" });
  useSuccessNotification({ isSuccess, message: "License record saved" });

  const validateFields = () => {
    if (!license.category || !license.name) {
      notifications.show("License Category and Name should not be empty", {
        severity: "error",
        key: "license-validation",
        autoHideDuration: 3000,
      });
      return false;
    }
    return true;
  }

  const handleLicenseRecordSave = async () => {
    if (!validateFields()) {
      return;
    }

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
    <Tooltip title="Save license record">
      <IconButton size="small" onClick={() => handleLicenseRecordSave()}><SaveOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export default SaveLicenseRecordButton;