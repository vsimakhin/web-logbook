import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
// MUI UI elements
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
// MUI Icons
import DisabledByDefaultOutlinedIcon from "@mui/icons-material/DisabledByDefaultOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
// Custom
import { queryClient } from "../../util/http/http";
import { createPersonToLog, updatePersonToLog } from "../../util/http/person";
import CardHeader from "../UIElements/CardHeader";
import PersonRole from "../UIElements/PersonRole";
import PersonSelect from "../UIElements/PersonSelect";
import AddPersonButton from "./AddPersonButton";
import {
  useErrorNotification,
  useSuccessNotification,
} from "../../hooks/useAppNotifications";
import { printPerson } from "../../util/helpers";

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}>
        <DisabledByDefaultOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

const SaveButton = ({ frPerson, isNew, onClose }) => {
  const navigate = useNavigate();

  const payload = {
    person_uuid: frPerson.person_uuid.id,
    role: frPerson.role,
    log_uuid: frPerson.log_uuid,
  };

  const mutateFn = isNew
    ? () => createPersonToLog({ payload, navigate })
    : () => updatePersonToLog({ payload, navigate });
  const {
    mutateAsync: savePersonToLog,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: mutateFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["persons-for-log", frPerson.log_uuid],
      });
    },
  });
  useErrorNotification({
    isError,
    error,
    fallbackMessage: "Failed to add person to log record",
  });
  useSuccessNotification({ isSuccess, message: "Person added to log record" });

  const handleOnClick = useCallback(async () => {
    await savePersonToLog();
    onClose();
  }, [savePersonToLog, onClose]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

export const AddEditFlightrecordPersonModal = ({ open, onClose, payload }) => {
  const [frPerson, setFrPerson] = useState({ ...payload });
  const isNew = payload.isNew;

  const handleChange = (key, value) => {
    setFrPerson((prev) => ({ ...prev, [key]: value }));
  };

  const onNewPerson = (person) => {
    if(!person) return;
    handleChange('person_uuid', {label: printPerson(person), id: person.uuid});
  }

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader
            title="Add person to flight"
            action={
              <>
                <SaveButton
                  frPerson={frPerson}
                  onClose={onClose}
                  isNew={isNew}
                />
                <CloseDialogButton onClose={onClose} />
              </>
            }
          />
          <Grid container spacing={1}>
            {isNew && (
              <>
                <PersonSelect
                  gsize={{ xs: 10, sm: 8, md: 8, lg: 8, xl: 8 }}
                  id="person_uuid"
                  label="Existing person"
                  handleChange={handleChange}
                  value={frPerson.person_uuid}
                />
                <Grid size={{ xs: 2, sm: 4, md: 4, lg: 4, xl: 4 }}>
                  or <AddPersonButton onSave={onNewPerson} />
                </Grid>
              </>
            )}
            <PersonRole
              gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="role"
              label="Role"
              handleChange={handleChange}
              value={frPerson.role}
            />
          </Grid>
        </CardContent>
      </Card>
    </Dialog>
  );
};

export default AddEditFlightrecordPersonModal;
