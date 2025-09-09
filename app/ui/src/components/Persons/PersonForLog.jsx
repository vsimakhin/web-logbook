import { useCallback, useState } from 'react';
import { Link } from "react-router-dom";
// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
// Custom
import { printPerson } from '../../util/helpers';
import DeletePersonToLogButton from './DeletePersonToLogButton';
import EditFlightrecordPersonButton from './EditFlightRecordPersonButton';

export const PersonForLog = ({ person, logUuid }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={handleClick} size="small"><PersonIcon /></IconButton>
        <Typography variant="body2" color="primary">
          <Link to={`/persons/${person.uuid}`} style={{ textDecoration: "none", color: "inherit" }}>
            {printPerson(person)} {person.role ? `(${person.role})` : null}
          </Link>
        </Typography>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <EditFlightrecordPersonButton person={person} logUuid={logUuid} handleClose={handleCloseMenu} />
        <DeletePersonToLogButton person={person} logUuid={logUuid} handleClose={handleCloseMenu} />
      </Menu>
    </>
  );
};

export default PersonForLog;