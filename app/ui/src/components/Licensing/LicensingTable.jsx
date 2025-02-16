import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
// Custom components and libraries
import NewLicenseRecordButton from './NewLicenseRecordButton';
import { calculateExpiry, createDateColumn, getExpireColor } from "./helpers";
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../constants/constants';
import { dateFilterFn } from '../../util/helpers';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';

const paginationKey = 'licensing-table-page-size';
const columnVisibilityKey = 'licensing-table-column-visibility';

const tableOptions = {
  initialState: {
    density: 'compact',
    expanded: true,
    grouping: ['category']
  },
  positionToolbarAlertBanner: 'bottom',
  groupedColumnMode: 'remove',
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnFilters: true,
  enableColumnDragging: false,
  enableColumnPinning: false,
  enableGrouping: true,
  enableDensityToggle: false,
  columnResizeMode: 'onEnd',
  muiTablePaperProps: { variant: 'outlined', elevation: 0 },
  columnFilterDisplayMode: 'custom',
  enableFacetedValues: true,
  enableSorting: true,
  enableColumnActions: true,
}

export const LisencingTable = ({ data, isLoading, ...props }) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const filterFns = useMemo(() => ({ dateFilterFn: dateFilterFn }), []);

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

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onShowColumnFiltersChange: () => (setIsFilterDrawerOpen(true)),
    filterFns: filterFns,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <NewLicenseRecordButton />
        <CSVExportButton table={table} type="licensing" />
      </Box>
    ),
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    ...tableOptions
  });

  return (
    <>
      <MaterialReactTable table={table} {...props} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} />
    </>
  );
}

export default LisencingTable;