import { memo } from "react";
// Custom
import HelpButtonDrawer from "../../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "Custom Fields",
    description: `Custom fields allow you to track additional information about your flights that 
      is not covered by the standard fields.`,
  },
  {
    title: 'Types of Custom Fields',
    description: `You can create custom fields of the following types: text, number, time, and duration. 
      Each type has its own set of statistics that can be calculated.`,
  },
  {
    title: 'Text Fields',
    description: 'Text fields allow you to enter any text. Available stats functions: none, count',
  },
  {
    title: 'Number Fields',
    description: `Number fields allow you to enter any number. Availale stats functions: none, sum, average, count.`,
  },
  {
    title: 'Time Fields',
    description: `Time fields allow you to enter a time in HHMM format. The field type is similar to the Departure and Arrival time fields.
      Available stats functions: none, count`,
  },
  {
    title: 'Duration Fields',
    description: `Duration fields allow you to enter a duration in HH:MM format. The field type is similar to the Flight Time field. 
      Available stats functions: sum, average, and count of the values.`,
  },
  {
    title: 'Stats Functions',
    description: `You can calculate statistics for custom fields. 
      If the stats function is set to "none", no statistics will be shown on the Dashboard page`
  }
];

export const HelpButton = memo(() => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
});

export default HelpButton;