import { memo } from 'react';
// MUI
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";

const ActionButtons = memo(({ }) => (
  <></>
));

export const CustomFields = () => {

  return (
    <>
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <CardHeader title="Custom Fields" action={<ActionButtons />} />
          {"table of custom fields"}
        </CardContent>
      </Card >
    </>
  );
}

export default CustomFields;