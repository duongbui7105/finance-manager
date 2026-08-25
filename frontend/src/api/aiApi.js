import api from "./axios";

export const aiApi = {
  chat:        (message)             => api.post("/ai/chat",         { message }),
  insights:    ()                    => api.get("/ai/insights"),
  categorize:  (note, amount)        => api.post("/ai/categorize",   { note, amount }),
  smartInput:  (text)                => api.post("/ai/smart-input",  { text }),
  scanReceipt: (base64Image, mimeType) =>
    api.post("/ai/scan-receipt", { base64Image, mimeType }),
};