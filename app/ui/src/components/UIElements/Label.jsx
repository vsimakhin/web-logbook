import Box from '@mui/material/Box';

export const Label = ({ icon: Icon, text }) => {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}><Icon />{text}</Box>
  )
}

export default Label;