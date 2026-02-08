import { createContext, useContext, useState } from "react";

type CashCountContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CashCountContext = createContext<CashCountContextType | null>(null);

export const CashCountProvider = ({ children }: any) => {
  const [open, setOpen] = useState(false);

  return (
    <CashCountContext.Provider value={{ open, setOpen }}>
      {children}
    </CashCountContext.Provider>
  );
};

export const useCashCount = () => {
  const ctx = useContext(CashCountContext);
  if (!ctx) throw new Error("useCashCount must be used inside provider");
  return ctx;
};
