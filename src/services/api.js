import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const flowAPI = {
  getFlow: (flowId = "default-flow") => api.get(`/flow/${flowId}`),
  saveFlow: (data, flowId = "default-flow") =>
    api.post(`/flow/save/${flowId}`, data),
  addNode: (data) => api.post("/flow/add-node", data),
  createStartNode: () => api.post("/flow/create-start"),
  deleteNode: (nodeId) => api.delete(`/flow/node/${nodeId}`),
};

export const questionAPI = {
  // Fixed method names to match your existing backend
  getAllQuestions: () => api.get("/questions"),
  getQuestionById: (id) => api.get(`/questions/${id}`),
  getFirstQuestion: () => api.get("/questions/start"),
  createQuestion: (data) => api.post("/questions", data),
  updateQuestion: (id, data) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),

  // Legacy support
  getAll: () => api.get("/questions"),
  getById: (id) => api.get(`/questions/${id}`),
  getFirst: () => api.get("/questions/start"),
  create: (data) => api.post("/questions", data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
};

export const conversationAPI = {
  getAll: () => api.get("/conversations"),
  create: (data) => api.post("/conversations", data),
  complete: (userId) => api.post("/conversations/complete", { userId }),
};

export default api;
