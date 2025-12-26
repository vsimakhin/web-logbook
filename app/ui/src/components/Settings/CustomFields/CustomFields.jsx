// MUI
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../../UIElements/CardHeader";
import CustomFieldsTable from './CustomFieldsTable';
import HelpButton from './HelpButton';

export const CustomFields = () => {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Custom Fields" action={<HelpButton />} />
        <CustomFieldsTable />
      </CardContent>
    </Card >
  );
}

export default CustomFields;