import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

export const Tile = ({ title, value, size = { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }) => {
  return (
    <Grid size={size}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="caption">{title}</Typography>
          <Typography variant="h4">{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default Tile;