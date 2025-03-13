import { useState } from "react";
import ImportTable from "./ImportTable";

export const Import = () => {
  const [data, setData] = useState([]);

  return (
    <>
      <ImportTable data={data} />
    </>
  );
}

export default Import;