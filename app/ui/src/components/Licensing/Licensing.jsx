import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useMemo } from "react";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
// Custom
import { fetchLicenses } from "../../util/http/licensing";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import LisencingTable from "./LicensingTable";
import { calculateExpiry, createDateColumn, getExpireColor } from "./helpers";

export const Licensing = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['licensing'],
    queryFn: ({ signal }) => fetchLicenses({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load aircrafts list' });

  const columns = useMemo(() => [
    { accessorKey: "category", header: "Category", size: 150 },
    {
      accessorKey: "name",
      header: "Name",
      Cell: ({ renderedCellValue, row }) => (
        <Typography variant="body2" color="primary">
          <Link to={`/licensing/${row.original.uuid}`} style={{ textDecoration: 'none', color: "inherit" }}>{renderedCellValue}</Link>
        </Typography>
      ),
      size: 250,
    },
    { accessorKey: "number", header: "Number" },
    createDateColumn("issued", "Issued"),
    createDateColumn("valid_from", "Valid From"),
    createDateColumn("valid_until", "Valid Until"),
    {
      accessorId: "expire",
      header: "Expire",
      Cell: ({ row }) => {
        const expiry = calculateExpiry(row.original.valid_until);
        if (!expiry) return null;

        return (
          <Typography variant="body2" color={getExpireColor(expiry.diffDays)}>
            {expiry.diffDays < 0
              ? 'Expired'
              : `${expiry.months > 0 ? `${expiry.months} month${expiry.months === 1 ? '' : 's'} ` : ''}${expiry.days} day${expiry.days === 1 ? '' : 's'}`}
          </Typography>
        );
      },
      size: 150,
    },
    { accessorKey: "remarks", header: "Remarks", grow: true },
  ], []);

  return (
    <>
      {isLoading && <LinearProgress />}
      <LisencingTable columns={columns} data={data} isLoading={isLoading} />
    </>
  )
}

export default Licensing;