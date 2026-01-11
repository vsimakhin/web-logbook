import { useCallback, useMemo } from "react";
import useSettings from "../../hooks/useSettings";
import XDataGrid from "../UIElements/XDataGrid/XDataGrid";
import dayjs from "dayjs";

export const XLicensingTable = ({ data, isLoading }) => {
  const { settings, isSettingsLoading } = useSettings();

  const getExpireColor = useCallback((days) => {
    const warning = settings?.licenses_expiration?.warning_period || 90;

    if (days < 0) return 'error';
    if (days < warning) return 'warning';
    return 'inherit';
  }, [settings]);

  const columns = useMemo(() => {
    if (isSettingsLoading) {
      return [];
    }

    return [
      {
        field: "category",
        headerName: "Category",
        width: 150,
      },
      {
        field: "name",
        headerName: "Name",
        width: 250,
      },
      {
        field: "number",
        headerName: "Number",
      },
      {
        field: "issued",
        headerName: "Issued",
        type: "date",
        valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
        valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
      },
      {
        field: "valid_from",
        headerName: "Valid From",
        type: "date",
        valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
        valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
      },
      {
        field: "valid_until",
        headerName: "Valid Until",
        type: "date",
        valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
        valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
      },
      {
        field: "expire",
        headerName: "Expire",
        type: "date",
        valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
        valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
      },
      {
        field: "remarks",
        headerName: "Remarks",
        width: 150,
      },
    ];
  }, [isSettingsLoading]);

  const customActions = useMemo(() => (
    <></>
    // <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
    //   <NewFlightRecordButton />
    //   <CSVExportButton rows={data} type="logbook" />
    //   <PDFExportButton />
    // </Box>
  ), [data]);

  return (
    <XDataGrid
      tableId='licensing'
      loading={isLoading}
      rows={data}
      columns={columns}
      getRowId={(row) => row.uuid}
      showAggregationFooter={false}
      disableColumnMenu
      // disableColumnSorting
      customActions={customActions}
    />
  )
}

export default XLicensingTable;