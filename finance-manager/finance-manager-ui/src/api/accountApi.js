import api from "./axios";

export const accountApi = {
  getAll:     ()           => api.get("/accounts"),
  getActive:  ()           => api.get("/accounts/active"),
  getByType:  (type)       => api.get(`/accounts/type/${type}`),
  getSummary: ()           => api.get("/accounts/summary"),
  getById:    (id)         => api.get(`/accounts/${id}`),
  create:     (data)       => api.post("/accounts", data),
  update:     (id, data)   => api.put(`/accounts/${id}`, data),
  remove:     (id)         => api.delete(`/accounts/${id}`),
};
