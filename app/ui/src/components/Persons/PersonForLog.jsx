// MUI UI elements
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// MUI Icons
import { printPerson } from '../../util/helpers';
import EditFlightrecordPersonButton from './EditFlightRecordPersonButton';
import DeletePersonToLogButton from './DeletePersonToLogButton';
// Custom

export const PersonForLog = ({ person, logUuid }) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditFlightrecordPersonButton person={person} logUuid={logUuid} />
        <DeletePersonToLogButton person={person} logUuid={logUuid} />
        <Typography variant="body2">
          {printPerson(person)} ({person.role})
        </Typography>
      </Box>
    </>
  );
};

export default PersonForLog;