import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useNotifications } from "@toolpad/core/useNotifications";
import * as toGeoJSON from "@mapbox/togeojson";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
// MUI Icons
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
// Custom components
import { queryClient } from "../../util/http/http";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { uploadAttachement } from "../../util/http/attachment";
import { uploadTrackLog } from "../../util/http/logbook";


export const AddKMLButton = ({ id }) => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { mutateAsync: upload, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async ({ data }) => await uploadAttachement({ payload: data, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attachments', id] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to upload attachment' });
  useSuccessNotification({ isSuccess, message: 'Attachment uploaded' });

  const { mutateAsync: uploadTrack, isPending: isTrackPending, isError: isTrackError, error: trackError, isSuccess: isTrackSuccess } = useMutation({
    mutationFn: async ({ data }) => await uploadTrackLog({ id, track: data, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attachments', id] });
      await queryClient.invalidateQueries({ queryKey: ['flight', id] });
    }
  });
  useErrorNotification({ isError: isTrackError, error: trackError, fallbackMessage: 'Failed to upload track log' });
  useSuccessNotification({ isSuccess: isTrackSuccess, message: 'Track log uploaded' });

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        try {
          const parser = new DOMParser();
          const kml = parser.parseFromString(e.target.result, "text/xml");
          const geojson = toGeoJSON.kml(kml);

          const extractedCoordinates = [];

          const processCoordinates = (coords, isPoint = false) => {
            if (isPoint) {
              const [lng, lat] = coords;
              extractedCoordinates.push([lat, lng]);
            } else {
              coords.forEach(coordinate => {
                const [lng, lat] = coordinate;
                extractedCoordinates.push([lat, lng]);
              });
            }
          };

          geojson.features.forEach(feature => {
            if (feature.geometry.type === 'Point') {
              processCoordinates(feature.geometry.coordinates, true);
            } else if (feature.geometry.type === 'LineString') {
              processCoordinates(feature.geometry.coordinates);
            } else if (feature.geometry.type === 'MultiGeometry') {
              feature.geometry.geometries.forEach(geometry => {
                if (geometry.type === 'Point') {
                  processCoordinates(geometry.coordinates, true);
                } else if (geometry.type === 'LineString') {
                  processCoordinates(geometry.coordinates);
                }
              });
            }
          });

          await uploadTrack({ data: extractedCoordinates });
        } catch (error) {
          notifications.show("Error parsing KML file", {
            severity: "error",
            key: "kml-parse-error",
            autoHideDuration: 3000,
          });
          console.log(error);
        }
      }
      reader.readAsText(file);

      // upload kml as attachment
      const formData = new FormData();
      formData.append('document', file);
      formData.append('id', id);

      await upload({ data: formData });
    }

  }, [upload, id]);

  return (
    <>
      {(isPending || isTrackPending) && <CircularProgress size={24} />}
      {!(isPending && isTrackPending) &&
        <Tooltip title="Add Track Log">
          <IconButton size="small" component="label" ><MapOutlinedIcon />
            <input hidden type="file" name="document" id="document" onChange={handleFileChange} accept=".kml" />
          </IconButton>
        </Tooltip>
      }
    </>
  );
}

export default AddKMLButton;