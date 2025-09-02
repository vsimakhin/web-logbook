import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Dialog from "@mui/material/Dialog";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid2";
// MUI Icons
import DisabledByDefaultOutlinedIcon from "@mui/icons-material/DisabledByDefaultOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
// Custom
import CardHeader from "../UIElements/CardHeader";
import TextField from "../UIElements/TextField";
import { queryClient } from "../../util/http/http";
import { printPerson } from "../../util/helpers";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { updatePerson, createPerson } from "../../util/http/person";

const CloseDialogButton = memo(({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}>
        <DisabledByDefaultOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
});

const SaveButton = memo(({ person, isNew, onClose }) => {
  const navigate = useNavigate();

  const payload = {
    uuid: person.uuid,
    first_name: person.first_name,
    middle_name: person.middle_name,
    last_name: person.last_name,
  };

  const mutateFn = isNew
    ? () => createPerson({ payload, navigate })
    : () => updatePerson({ payload, navigate });
  const {
    mutateAsync: savePerson,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: mutateFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["persons"] });
      await queryClient.invalidateQueries({ queryKey: ["person", person.uuid] });
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to save person" });
  useSuccessNotification({ isSuccess, message: "Person saved" });

  const handleOnClick = useCallback(async () => {
    const savedPerson = await savePerson();
    onClose(savedPerson);
  }, [savePerson, onClose]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
});

export const AddEditPersonModal = ({ open, onClose, payload }) => {
  const [person, setPerson] = useState({ ...payload });
  const isNew = payload.isNew;

  const handleChange = useCallback((key, value) => {
    setPerson((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader
            title={isNew ? 'New person' : `Person: ${printPerson(person)}`}
            action={
              <>
                <SaveButton person={person} onClose={onClose} isNew={isNew} />
                <CloseDialogButton onClose={() => onClose()} />
              </>
            }
          />
          <Grid container spacing={1}>
            <TextField
              gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="first_name"
              label="First name"
              handleChange={handleChange}
              value={person.first_name}
            />
            <TextField
              gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="middle_name"
              label="Middle name"
              handleChange={handleChange}
              value={person.middle_name}
            />
            <TextField
              gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="last_name"
              label="Last name"
              handleChange={handleChange}
              value={person.last_name}
            />
          </Grid>
        </CardContent>
      </Card>
    </Dialog>
  );
};

export default AddEditPersonModal;
