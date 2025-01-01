import MUICardHeader from '@mui/material/CardHeader';

export const CardHeader = ({ title, ...props }) => {
  return (
    <MUICardHeader title={title} sx={{ p: 0, mb: 1 }}
      titleTypographyProps={{ variant: "overline", }}
      {...props} />
  )
}

export default CardHeader;