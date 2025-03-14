import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";

export function useErrorNotification({ isError, error, fallbackMessage }) {
  const notifications = useNotifications();

  useEffect(() => {
    if (isError) {
      const errorMessage = error.info?.message || error?.message || fallbackMessage;
      notifications.show(errorMessage, {
        severity: "error",
        key: fallbackMessage,
        autoHideDuration: 3000,
      });
    }
  }, [isError, error, notifications, fallbackMessage]);
}

export function useSuccessNotification({ isSuccess, message }) {
  const notifications = useNotifications();

  useEffect(() => {
    if (isSuccess) {
      notifications.show(message, {
        severity: "success",
        key: message,
        autoHideDuration: 3000,
      });
    }
  }, [isSuccess, notifications, message]);
}