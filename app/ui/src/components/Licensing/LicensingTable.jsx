import { useCallback, useMemo } from "react";
import useSettings from "../../hooks/useSettings";
import XDataGrid from "../UIElements/XDataGrid/XDataGrid";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link } from "react-router";
import { calculateExpiry } from "./helpers";
import CSVExportButton from "../UIElements/CSVExportButton";
import NewLicenseRecordButton from "./NewLicenseRecordButton";

export const LicensingTable = ({ data, isLoading }) => {
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
        headerAlign: "center",
        width: 150,
        renderCell: (params) => (
          <Typography fontWeight="500">
            {params.formattedValue}
          </Typography>
        ),
      },
      {
        field: "name",
        headerName: "Name",
        headerAlign: "center",
        width: 250,
        renderCell: (params) => (
          <Typography variant="body2" color="primary">
            <Link to={`/licensing/${params.row.uuid}`} style={{ textDecoration: 'none', color: "inherit" }}>
              {params.formattedValue}
            </Link>
          </Typography>
        ),
      },
      {
        field: "number",
        headerName: "Number",
        headerAlign: "center",
        width: 200,
        rowSpanValueGetter: () => null,
      },
      {
        field: "issued",
        headerName: "Issued",
        headerAlign: "center",
        type: "date",
        align: "center",
        valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
        valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
      },
      {
        field: "valid_from",
        headerName: "Valid From",
        headerAlign: "center",
        type: "date",
        align: "center",
        valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
        valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
      },
      {
        field: "valid_until",
        headerName: "Valid Until",
        headerAlign: "center",
        align: "center",
        type: "date",
        valueGetter: (value) => (value ? dayjs(value, 'DD/MM/YYYY').toDate() : null),
        valueFormatter: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : ''),
      },
      {
        field: "expire",
        headerName: "Expire",
        headerAlign: "center",
        width: 150,
        renderCell: (params) => {
          const expiry = calculateExpiry(params.row.valid_until);
          if (!expiry) return null;

          return (
            <Typography variant="body2" color={getExpireColor(expiry.diffDays)}>
              {expiry.diffDays < 0
                ? 'Expired'
                : `${expiry.months > 0 ? `${expiry.months} month${expiry.months === 1 ? '' : 's'} ` : ''}${expiry.days} day${expiry.days === 1 ? '' : 's'}`}
            </Typography>
          );
        },
      },
      {
        field: "remarks",
        headerName: "Remarks",
        headerAlign: "center",
        width: 250,
        rowSpanValueGetter: () => null,
      },
    ];
  }, [isSettingsLoading, getExpireColor]);

  const customActions = useMemo(() => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <NewLicenseRecordButton />
      <CSVExportButton rows={data} type="licensing" />
    </Box>
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
      customActions={customActions}
      rowSpanning={true}
    />
  )
}

export default LicensingTable;