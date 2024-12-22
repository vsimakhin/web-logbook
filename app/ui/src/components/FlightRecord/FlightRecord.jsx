import { useParams } from "react-router-dom";

export const FlightRecord = () => {
  const { id } = useParams();

  return (
    <>
      <h1>Flight Record</h1>
      <p>Flight ID: {id}</p>
    </>
  );
}

export default FlightRecord;