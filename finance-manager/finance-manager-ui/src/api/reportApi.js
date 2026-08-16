import api from "./axios";

export const reportApi = {
  monthly:    (year)        => api.get("/reports/monthly",    { params: { year } }),
  categories: (from, to)    => api.get("/reports/categories", { params: { from, to } }),
  daily:      (year, month) => api.get("/reports/daily",      { params: { year, month } }),
};