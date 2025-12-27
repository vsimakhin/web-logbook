// Custom
import HelpButtonDrawer from "../../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "Standard Fields",
    description: `Here you can configure the headers for the standard fields used in the logbook table and the stats tables.`,
  },
];

export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
};

export default HelpButton;