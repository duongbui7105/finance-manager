import api from "./axios";

export const transactionApi = {
  getAll:   (params)      => api.get("/transactions",          { params }),
  create:   (data)        => api.post("/transactions",          data),
  update:   (id, data)    => api.put(`/transactions/${id}`,    data),
  remove:   (id)          => api.delete(`/transactions/${id}`),
  search:   (params)      => api.get("/transactions/search",   { params }),
  summary:  ()            => api.get("/transactions/summary"),
  batch:    (list)        => api.post("/transactions/batch",    list),
};

export const categoryApi = {
  getAll: () => api.get("/categories"),
};