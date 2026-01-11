import { useCallback, useMemo } from "react";
import useSettings from "../../hooks/useSettings";
import XDataGrid from "../UIElements/XDataGrid/XDataGrid";
import dayjs from "dayjs";
import { Typography } from "@mui/material";
import { Link } from "react-router";

const calculateExpiry = (validUntil) => {
  if (!validUntil) return null;

  const today = dayjs();
  const expiryDate = dayjs(validUntil, "DD/MM/YYYY");

  if (!expiryDate.isValid()) return null;

  const diffMonths = expiryDate.diff(today, 'month');
  const remainingDays = expiryDate.diff(today.add(diffMonths, 'month'), 'day');
  const diffDays = expiryDate.diff(today, 'day');

  return { months: diffMonths, days: remainingDays, diffDays };
};

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
        width: 200,
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
        flex: 1,

      },
    ];
  }, [isSettingsLoading, getExpireColor]);

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
      customActions={customActions}
    // rowSpanning={true}
    />
  )
}

export default XLicensingTable;