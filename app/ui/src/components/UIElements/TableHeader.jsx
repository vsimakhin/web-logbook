import { memo } from "react";

export const TableHeader = memo(({ title }) => {
  return (
    <div style={{ whiteSpace: 'normal', textAlign: 'center' }}>{title}</div>
  );
});

export default TableHeader;