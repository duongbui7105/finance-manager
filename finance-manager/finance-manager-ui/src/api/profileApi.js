import api from "./axios";

export const profileApi = {
  getProfile:         ()          => api.get("/users/profile"),
  updateProfile:      (data)      => api.put("/users/profile", data),
  changePassword:     (data)      => api.put("/users/password", data),
  getBudget:          ()          => api.get("/users/budget"),
  saveBudget:         (data)      => api.put("/users/budget", data),
  getSavingsGoals:    ()          => api.get("/users/savings-goals"),
  createSavingsGoal:  (data)      => api.post("/users/savings-goals", data),
  updateSavingsGoal:  (id, data)  => api.put(`/users/savings-goals/${id}`, data),
  deleteSavingsGoal:  (id)        => api.delete(`/users/savings-goals/${id}`),
};
