// Custom
import HelpButtonDrawer from "../../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "Previous Experience",
    description: "You can set your previous flight experience here. These values will be added to the totals in the logbook table, PDF export and Dashboard Totals.",
  },
  {
    title: "SP Multi Engine vs Total Multi Engine Time",
    description: `SP Multi Engine Time is what you see in the logbook table under the Single Pilot ME column. 
      Total Multi Engine Time is shown in the Dashboard Stats as Multi Engine - it can include Single Pilot ME and Multi Pilot ME`,
  },
  {
    title: "Cross Country Time",
    description: `There is no direct enrties for this particular type of flight time in the app. 
      However it's automatically calculated when Departure and Arrival airports are different, 
      and totals are shown in the Dashboard Stats.`,
  },
];

export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
}

export default HelpButton;