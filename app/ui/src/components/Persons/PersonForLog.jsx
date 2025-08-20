import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link } from "react-router-dom";
import { printPerson } from '../../util/helpers';
import DeletePersonToLogButton from './DeletePersonToLogButton';
import EditFlightrecordPersonButton from './EditFlightRecordPersonButton';

export const PersonForLog = ({ person, logUuid }) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditFlightrecordPersonButton person={person} logUuid={logUuid} />
        <DeletePersonToLogButton person={person} logUuid={logUuid} />
        <Typography variant="body2" color="primary">
          <Link
              to={`/persons/${person.uuid}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
          {printPerson(person)} ({person.role})
          </Link>
        </Typography>
      </Box>
    </>
  );
};

export default PersonForLog;