import { useState } from 'react';
// MUI
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import CardContent from '@mui/material/CardContent';
// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// Custom
import CardHeader from './CardHeader';
import { CODE_BOOLEAN, useLocalStorageState } from '../../hooks/useLocalStorageState';

export default function CollapsibleCard({
  id,
  title,
  subheader,
  action,
  defaultExpanded = true,
  children,
  ...cardProps
}) {
  const persist = Boolean(id);

  const [storedExpanded, setStoredExpanded] = useLocalStorageState(`card-${id}`, defaultExpanded, { codec: CODE_BOOLEAN });
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);

  const expanded = persist ? storedExpanded : localExpanded;
  const setExpanded = persist ? setStoredExpanded : setLocalExpanded;
  const toggle = () => setExpanded(!expanded);

  return (
    <Card variant="outlined" {...cardProps}>
      <CardHeader
        onClick={toggle}
        title={title}
        subheader={subheader}
        avatar={
          <IconButton
            size="small"
            edge="start"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            sx={{
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: (theme) => theme.transitions.create('transform'),
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        }
        // stopPropagation so clicking your action buttons doesn't toggle the card
        action={action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
        sx={{
          mt: 1,
          cursor: 'pointer',
          px: 0.5,
          py: 1,
          '& .MuiCardHeader-avatar': { mr: 0 },
          '& .MuiCardHeader-action': { m: 0, alignSelf: 'center' },
        }}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0, '&:last-child': { pb: 2 } }}>
          {children}
        </CardContent>
      </Collapse>
    </Card>
  );
}