import { useState } from 'react';
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

  const customActions = (
    <>
      <HelpButton />
      <ClearTableButton setData={setData} />
      <OpenCSVButton setData={setData} />
      <RunImportButton data={data} />
    </>
  );

  return (
    <>
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