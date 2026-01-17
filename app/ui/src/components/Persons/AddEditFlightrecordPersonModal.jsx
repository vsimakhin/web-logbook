import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
// MUI UI elements
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import Grid from "@mui/material/Grid";
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
  const payload = {
    person_uuid: frPerson.person_uuid.id,
    role: frPerson.role,
    log_uuid: frPerson.log_uuid,
  };

  const mutateFn = isNew
    ? () => createPersonToLog({ payload })
    : () => updatePersonToLog({ payload });
  const { mutateAsync: savePersonToLog, isError, error, isSuccess } = useMutation({
    mutationFn: mutateFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["persons", "log", frPerson.log_uuid] });
      await queryClient.invalidateQueries({ queryKey: ["persons", "flights"] })
      await queryClient.invalidateQueries({ queryKey: ["persons", "roles"] })
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to add person to log record" });
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

  const handleChange = useCallback((key, value) => {
    setFrPerson((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onNewPerson = (person) => {
    if (!person) return;
    handleChange('person_uuid', { label: printPerson(person), id: person.uuid });
  }

  const ActionButtons = (
    <>
      <SaveButton frPerson={frPerson} onClose={onClose} isNew={isNew} />
      <CloseDialogButton onClose={onClose} />
    </>
  );

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Add person to flight" action={ActionButtons} />
          <Grid container spacing={1}>
            {isNew && (
              <>
                <PersonSelect
                  gsize={{ xs: 10, sm: 11, md: 11, lg: 11, xl: 11 }}
                  id="person_uuid"
                  label="Existing person"
                  handleChange={handleChange}
                  value={frPerson.person_uuid}
                />
                <Grid size={{ xs: "grow", sm: "grow", md: "grow", lg: "grow", xl: "grow" }}>
                  <AddPersonButton onSave={onNewPerson} />
                </Grid>
              </>
            )}
            <PersonRole
              gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
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
