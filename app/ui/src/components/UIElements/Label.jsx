import Box from '@mui/material/Box';

export const Label = ({ icon: Icon, text }) => {
  return (
    <Box gap={0.5} display="flex" alignItems="center"><Icon />{text}</Box>
  )
}

export default Label;