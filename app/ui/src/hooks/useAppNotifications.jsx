import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";

export function useErrorNotification({ isError, error, fallbackMessage, options }) {
  const notifications = useNotifications();

  useEffect(() => {
    if (isError) {
      const errorMessage = error.info?.message || error?.message || fallbackMessage;
      notifications.show(errorMessage, {
        severity: "error",
        key: options?.key || fallbackMessage,
        autoHideDuration: 3000,
      });
    }
  }, [isError, error, notifications, fallbackMessage, options]);
}

export function useSuccessNotification({ isSuccess, message, options }) {
  const notifications = useNotifications();

  useEffect(() => {
    if (isSuccess) {
      notifications.show(message, {
        severity: "success",
        key: options?.key || message,
        autoHideDuration: 3000,
      });
    }
  }, [isSuccess, notifications, message, options]);
}