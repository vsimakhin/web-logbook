import { useMemo, useState } from 'react';
// MUI UI elements
import LinearProgress from '@mui/material/LinearProgress';
// MUI Icons
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
// Custom components and libraries
import OpenCSVButton from './OpenCSVButton';
import ClearTableButton from './ClearTableButton';
import RunImportButton from './RunImportButton';
import HelpButton from './HelpButton';
import LogbookTable from '../Logbook/LogbookTable';

export const ImportTable = () => {
  const [data, setData] = useState([]);
  const [inProgress, setInProgress] = useState(false);

  const customActions = useMemo(() => (
    <>
      <HelpButton />
      <ClearTableButton setData={setData} />
      <OpenCSVButton setData={setData} />
      <RunImportButton data={data} inProgress={inProgress} setInProgress={setInProgress} />
    </>
  ), [data, inProgress]);

  return (
    <>
      {inProgress && <LinearProgress />}
      <LogbookTable
        data={data}
        customActions={customActions}
        title="Import"
        icon={<FileUploadOutlinedIcon />}
        disableColumnSorting
        disableColumnMenu
      />
    </>
  );
}

export default ImportTable;