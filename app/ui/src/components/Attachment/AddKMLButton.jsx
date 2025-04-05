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
      await queryClient.invalidateQueries({ queryKey: ['map-logbook'] })
    }
  });
  useErrorNotification({ isError: isTrackError, error: trackError, fallbackMessage: 'Failed to upload track log' });
  useSuccessNotification({ isSuccess: isTrackSuccess, message: 'Track log uploaded' });

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Read the file as text
      const fileText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Parse KML to GeoJSON
      const parser = new DOMParser();
      const kml = parser.parseFromString(fileText, "text/xml");
      const geojson = toGeoJSON.kml(kml);

      const extractedCoordinates = [];

      const processCoordinates = (coords, isPoint = false) => {
        if (isPoint) {
          const [lng, lat] = coords;
          extractedCoordinates.push([lat, lng]);
        } else {
          coords.forEach(([lng, lat]) => {
            extractedCoordinates.push([lat, lng]);
          });
        }
      };

      geojson.features.forEach((feature) => {
        const { geometry } = feature;
        if (!geometry) return;

        if (geometry.type === 'Point') {
          processCoordinates(geometry.coordinates, true);
        } else if (geometry.type === 'LineString') {
          processCoordinates(geometry.coordinates);
        } else if (geometry.type === 'MultiGeometry' && geometry.geometries) {
          geometry.geometries.forEach((g) => {
            if (g.type === 'Point') {
              processCoordinates(g.coordinates, true);
            } else if (g.type === 'LineString') {
              processCoordinates(g.coordinates);
            }
          });
        }
      });

      // Upload KML as attachment
      const formData = new FormData();
      formData.append("document", file);
      formData.append("id", id);

      // Run uploads sequentially to avoid DB lock
      await upload({ data: formData });
      await uploadTrack({ data: extractedCoordinates });
    } catch (error) {
      notifications.show("Error parsing or uploading KML file", {
        severity: "error",
        key: "kml-parse-error",
        autoHideDuration: 3000,
      });
      console.error(error);
    }
  }, [upload, uploadTrack, id]);

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