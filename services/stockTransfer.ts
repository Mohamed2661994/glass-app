import api from "./api";

export const previewWholesaleToRetail = (data: any) => {
  return api.post("/stock/wholesale-to-retail/preview", data);
};

export const executeWholesaleToRetail = (data: any) => {
  return api.post("/stock/wholesale-to-retail/execute", data);
};
