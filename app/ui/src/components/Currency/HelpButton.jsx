// Custom
import HelpButtonDrawer from "../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "Currency",
    description: 'This section is for tracking your currency and flight experience.',
  },
  {
    title: 'Examples',
    description: 'EASA flight duty time regulations',
  },
  {
    title: '',
    description: '- 90 hours for the last 28 days',
  },
  {
    title: '',
    description: '- 280 hours for the last 90 days',
  },
  {
    title: '',
    description: '- 1000 hours for the last 12 calendar months',
  },
  {
    title: '',
    description: '- 900 hours for the calendar year',
  },
  {
    title: 'Expiration Date and Validity',
    description: `Automatically tracking expiration and validity for landing and time based rules.`,
  },
  {
    title: '',
    description: '- Landing based: 90 days after the 3rd most recent qualifying landing'
  },
  {
    title: '',
    description: '- Time based: Expiry is the date when the oldest needed flight exits the rolling window (days)'
  }
];

export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
}

export default HelpButton;