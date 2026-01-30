import React, { createContext, useContext, useState } from "react";

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, "id" | "read">) => void;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = (notif: Omit<AppNotification, "id" | "read">) => {
    setNotifications((prev) => [
      { ...notif, id: Date.now(), read: false },
      ...prev,
    ]);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, setNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  return ctx;
};
