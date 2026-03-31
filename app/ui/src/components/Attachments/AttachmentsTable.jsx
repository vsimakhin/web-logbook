import { useCallback, useMemo, useState } from "react";
import { Link } from 'react-router';
import dayjs from "dayjs";
import { GridActionsCell, useGridApiRef } from "@mui/x-data-grid";
// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// MUI Icon
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
// Custom
import TableActionHeader from "../UIElements/TableActionHeader";
import XDataGrid from "../UIElements/XDataGrid/XDataGrid";
import DownloadAttachmentButton from "./DownloadAttachmentButton";
import DeleteAttachmentButton from "./DeleteAttachmentButton";
import DownloadAllAttachmentsButton from "./DownloadAllAttachmentsButton";


export const AttachmentsTable = ({ attachments, setSelectedAttachment }) => {
  const apiRef = useGridApiRef();
  const [filteredRows, setFilteredRows] = useState([]);

  const columns = useMemo(() => [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 50,
      renderHeader: () => <TableActionHeader />,
      renderCell: (params) => (
        <GridActionsCell suppressChildrenValidation {...params} >
          <DownloadAttachmentButton attachment={params.row} showInMenu />
          <DeleteAttachmentButton attachment={params.row} showInMenu />
        </GridActionsCell>
      ),
    },
    {
      field: "flight_date",
      headerName: "Flight Date",
      headerAlign: "center",
      width: 90,
      type: "date",
      valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
      valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
    },
    {
      field: "flight_info",
      headerName: "Flight Info",
      headerAlign: "center",
      align: "center",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" color="primary">
            <Link to={`/logbook/${params.row.record_id}`} style={{ textDecoration: 'none', color: "inherit" }}>
              {params.row.flight_info}
            </Link>
          </Typography>
        </Box>
      ),
    },
    {
      field: "document_name",
      headerName: "Document Name",
      headerAlign: "center",
      flex: 1
    },
    {
      field: "document_type",
      headerName: "Type",
      headerAlign: "center",
      align: "center",
      width: 70,
      columnType: 'autocomplete',
      valueGetter: (_, row) => row.document_name.split('.').pop().toUpperCase(),
    },
    {
      field: "document_size",
      headerName: "Size (KB)",
      headerAlign: "center",
      align: "center",
      width: 80,
      type: "number",
    }
  ], []);

  const customActions = useMemo(() => (<DownloadAllAttachmentsButton filteredRows={filteredRows} />), [filteredRows]);

  const onRowClick = useCallback((params) => { setSelectedAttachment(params.row) }, [setSelectedAttachment]);

  return (
    <XDataGrid
      apiRef={apiRef}
      tableId='attachments'
      title="Attachments"
      icon={<AttachFileOutlinedIcon />}
      rows={attachments}
      columns={columns}
      getRowId={(row) => row.uuid}
      showAggregationFooter={false}
      disableColumnMenu
      customActions={customActions}
      onRowClick={onRowClick}
      onFilteredRowsChange={setFilteredRows}
    />
  );
}

export default AttachmentsTable;
