import { ToolbarButton } from "@mui/x-data-grid";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
// MUI Icons
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';

// Custom components
import CardHeader from "../UIElements/CardHeader";
import { runImport } from "../../util/http/import";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import ImportLogDialog from "./ImportLogDialog";
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import { useCustomFields } from '../../hooks/useCustomFields';


const ImportOptionsDialog = ({ open, onClose }) => {
  const [options, setOptions] = useState({ backup: false, recalculate_night_time: false, create_persons: false, create_person_format: '', create_person_from: {} });
  // const handleChange = useCallback((key, value) => { setOptions((prev) => ({ ...prev, [key]: value })) }, [setOptions]);
  const { customFields } = useCustomFields();

  const handleChange = useCallback((key, value) => {

    setOptions((options) => {
      const keys = key.split('.'); // Split key by dots to handle nesting
      let updatedOptions = { ...options }; // Create a shallow copy of the flight object
      let current = updatedOptions;

      // Traverse and create nested objects as needed
      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          // Update the final key with the new value
          current[k] = value;
        } else {
          // Ensure the next level exists
          current[k] = current[k] ? { ...current[k] } : {};
          current = current[k];
        }
      });

      return updatedOptions;
    });
  }, []);

  const actionButtons = useMemo(() => (
    <Box display="flex" alignItems="center" gap={0}>
      <Tooltip title="Run Import">
        <span>
          <IconButton size="small" onClick={() => onClose(options)} disabled={options.backup === false} >
            <FileUploadOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Close">
        <IconButton size="small" onClick={onClose}>
          <DisabledByDefaultOutlinedIcon />
        </IconButton>
      </Tooltip>
    </Box >
  ), [onClose, options])

  return (
    <Dialog fullWidth open={open} onClose={() => onClose(null)}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Import Options" action={actionButtons} />
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.backup}
                    onChange={(_event, checked) => { handleChange('backup', checked) }}
                  />
                }
                label="I have a logbook backup"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!options.recalculate_night_time}
                    onChange={(_event, checked) => { handleChange('recalculate_night_time', checked) }}
                  />
                }
                label="Recalculate Night Time"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!options.create_persons}
                    onChange={(_event, checked) => { handleChange('create_persons', checked) }}
                  />
                }
                label="Create persons"
              />

              <Box borderLeft={1} ml={3} p={1} borderColor="grey.200" >
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <FormControlLabel disabled={!options.create_persons}
                      control={
                        <Switch
                          checked={!!options.create_person_from?.pic}
                          onChange={(_event, checked) => { handleChange(`create_person_from.pic`, checked) }}
                        />
                      }
                      label={`PIC Field`}
                    />
                  </Grid>
                  {customFields?.map((customField) => (
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }} key={customField.uuid}>
                      <FormControlLabel disabled={!options.create_persons}
                        control={
                          <Switch
                            checked={!!options.create_person_from?.[customField.uuid]}
                            onChange={(_event, checked) => { handleChange(`create_person_from.${customField.uuid}`, checked) }}
                          />
                        }
                        label={`${customField.name}`}
                      />
                    </Grid>
                  ))}

                  <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                    <FormControlLabel disabled={!options.create_persons}
                      sx={{ m: 0, width: '100%', display: 'flex', justifyContent: 'space-between' }}
                      control={
                        <ToggleButtonGroup
                          size="small"
                          sx={{ ml: 1 }}
                          value={options.create_person_format || 'fn_mn_ln'}
                          onChange={(_, value) => {
                            if (value) {
                              handleChange('create_person_format', value)
                            }
                          }}
                          exclusive
                        >
                          <Tooltip title={
                            <>
                              <b>First Name, Middle Name, Last Name.</b> <br />
                              Example:<br />
                              &nbsp;&nbsp; 3 parts → First / Middle / Last<br />
                              &nbsp;&nbsp; 2 parts → First / Last<br />
                              &nbsp;&nbsp; 1 part → Last
                            </>
                          }>
                            <ToggleButton value={'fn_mn_ln'}>FN MN LN</ToggleButton>
                          </Tooltip>

                          <Tooltip title={
                            <>
                              <b>Last Name, First Name, Middle Name.</b> <br />
                              Example:<br />
                              &nbsp;&nbsp; 3 parts → Last / First / Middle<br />
                              &nbsp;&nbsp; 2 parts → Last / First<br />
                              &nbsp;&nbsp; 1 part → Last
                            </>
                          }>
                            <ToggleButton value={'ln_fn_md'}>LN FN MD</ToggleButton>
                          </Tooltip>
                          <Tooltip title={
                            <>
                              <b>First Name, Last Name, Middle Name.</b> <br />
                              Example:<br />
                              &nbsp;&nbsp; 3 parts → First / Last / Middle<br />
                              &nbsp;&nbsp; 2 parts → First / Last<br />
                              &nbsp;&nbsp; 1 part → First
                            </>
                          }>
                            <ToggleButton value={'fn_ln_md'}>FN LN MD</ToggleButton>
                          </Tooltip>
                        </ToggleButtonGroup>
                      }
                      label="Name Format"
                      labelPlacement="start"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

          </Grid>
        </CardContent>
      </Card>
    </Dialog>
  )
}

export const RunImportButton = ({ data, inProgress, setInProgress }) => {
  const dialogs = useDialogs();

  const { mutateAsync: importFlightRecords, isError, error } = useMutation({
    mutationFn: ({ payload }) => runImport({ payload }),
    onSuccess: async (payload) => {
      if (payload) {
        await dialogs.open(ImportLogDialog, payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['logbook'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to import flight records' });

  const importData = async (recalculate) => {
    setInProgress(true);

    const payload = {
      recalculate_night_time: recalculate,
      data: data,
    };

    try {
      await importFlightRecords({ payload });
    } finally {
      setInProgress(false);
    }
  }

  const handleImportClick = async () => {
    const options = await dialogs.open(ImportOptionsDialog);
    if (options) {
      console.log(options)
    }
    // const confirmed = await dialogs.confirm('Have you created a backup before import data?', {
    //   title: 'Backup data',
    //   severity: 'error',
    //   okText: 'Yes, continue',
    //   cancelText: 'Arrr, no',
    // });

    // if (confirmed) {
    //   const recalculate = await dialogs.confirm('Do you want to recalculate night time for the imported records?', {
    //     title: 'Recalculate night time',
    //     severity: 'error',
    //     okText: 'Yes, recalculate',
    //     cancelText: 'No, leave as is',
    //   });
    //   await importData(recalculate);
    // }
  };

  return (
    <Tooltip title="Run Import">
      <span>
        <ToolbarButton disabled={inProgress || data.length === 0} onClick={handleImportClick} color="default" label="Run Import">
          <FileUploadOutlinedIcon />
        </ToolbarButton>
      </span>
    </Tooltip>
  );
}

export default RunImportButton;