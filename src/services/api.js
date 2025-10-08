import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ NEW: Partner context management
let currentPartnerId = null;

export const setPartnerId = (partnerId) => {
  currentPartnerId = partnerId;
  console.log("🏢 Set current partner ID:", partnerId);
};

export const getPartnerId = () => {
  return currentPartnerId;
};

// ✅ UPDATED: Flow API with multi-tenant support
export const flowAPI = {
  getFlow: (flowId = "default-flow", uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for getFlow");
    }
    return api.get(`/flow/${uniquePartnerId}/${flowId}`);
  },

  saveFlow: (
    data,
    flowId = "default-flow",
    uniquePartnerId = currentPartnerId
  ) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for saveFlow");
    }
    return api.post(`/flow/save/${uniquePartnerId}/${flowId}`, data);
  },

  addNode: (data, uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for addNode");
    }
    return api.post("/flow/add-node", { ...data, uniquePartnerId });
  },

  createStartNode: (uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for createStartNode");
    }
    return api.post("/flow/create-start", { uniquePartnerId });
  },

  deleteNode: (nodeId, uniquePartnerId = currentPartnerId) => {
    const queryParam = uniquePartnerId
      ? `?uniquePartnerId=${uniquePartnerId}`
      : "";
    return api.delete(`/flow/node/${nodeId}${queryParam}`);
  },
};

// ✅ UPDATED: Question API with multi-tenant support
export const questionAPI = {
  // Main methods
  getAllQuestions: (uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for getAllQuestions");
    }
    return api.get(`/questions?uniquePartnerId=${uniquePartnerId}`);
  },

  getQuestionById: (id, uniquePartnerId = currentPartnerId) => {
    const queryParam = uniquePartnerId
      ? `?uniquePartnerId=${uniquePartnerId}`
      : "";
    return api.get(`/questions/${id}${queryParam}`);
  },

  getFirstQuestion: (uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for getFirstQuestion");
    }
    return api.get(`/questions/start?uniquePartnerId=${uniquePartnerId}`);
  },

  createQuestion: (data, uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for createQuestion");
    }
    return api.post("/questions", { ...data, uniquePartnerId });
  },

  updateQuestion: (id, data, uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for updateQuestion");
    }
    return api.put(`/questions/${id}`, { ...data, uniquePartnerId });
  },

  deleteQuestion: (id, uniquePartnerId = currentPartnerId) => {
    const queryParam = uniquePartnerId
      ? `?uniquePartnerId=${uniquePartnerId}`
      : "";
    return api.delete(`/questions/${id}${queryParam}`);
  },

  // ✅ UPDATED: Legacy support methods
  getAll: (uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for getAll");
    }
    return api.get(`/questions?uniquePartnerId=${uniquePartnerId}`);
  },

  getById: (id, uniquePartnerId = currentPartnerId) => {
    const queryParam = uniquePartnerId
      ? `?uniquePartnerId=${uniquePartnerId}`
      : "";
    return api.get(`/questions/${id}${queryParam}`);
  },

  getFirst: (uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for getFirst");
    }
    return api.get(`/questions/start?uniquePartnerId=${uniquePartnerId}`);
  },

  create: (data, uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for create");
    }
    return api.post("/questions", { ...data, uniquePartnerId });
  },

  update: (id, data, uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for update");
    }
    return api.put(`/questions/${id}`, { ...data, uniquePartnerId });
  },

  delete: (id, uniquePartnerId = currentPartnerId) => {
    const queryParam = uniquePartnerId
      ? `?uniquePartnerId=${uniquePartnerId}`
      : "";
    return api.delete(`/questions/${id}${queryParam}`);
  },
};

// ✅ UPDATED: Conversation API with multi-tenant support
export const conversationAPI = {
  getAll: (uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for getAll conversations");
    }
    return api.get(`/conversations?uniquePartnerId=${uniquePartnerId}`);
  },

  create: (data, uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for create conversation");
    }
    return api.post("/conversations", { ...data, uniquePartnerId });
  },

  complete: (userId, uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for complete conversation");
    }
    return api.post("/conversations/complete", { userId, uniquePartnerId });
  },

  getByUserId: (userId, uniquePartnerId = currentPartnerId) => {
    if (!uniquePartnerId) {
      throw new Error("uniquePartnerId is required for getByUserId");
    }
    return api.get(
      `/conversations/${userId}?uniquePartnerId=${uniquePartnerId}`
    );
  },
};

export default api;
