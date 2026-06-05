import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 90000,           // 90 s — question generation can take a moment
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'An error occurred'
    return Promise.reject(new Error(msg))
  }
)

export const sessionAPI = {
  getRoles:      ()           => api.get('/sessions/roles'),
  createSession: (data)       => api.post('/sessions/', data),
  getSession:    (id)         => api.get(`/sessions/${id}`),
  listSessions:  ()           => api.get('/sessions/'),
}

export const resumeAPI = {
  uploadResume: (sessionId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/resume/upload/${sessionId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const interviewAPI = {
  startInterview:  (sessionId)                    => api.post(`/interview/start/${sessionId}`),
  getQuestion:     (sessionId, index)             => api.get(`/interview/${sessionId}/question/${index}`),
  submitAnswer:    (sessionId, questionId, answer) =>
    api.post(`/interview/${sessionId}/answer/${questionId}`, { answer_text: answer }),
  getStatus:       (sessionId)                    => api.get(`/interview/${sessionId}/status`),
  getAllQuestions:  (sessionId)                    => api.get(`/interview/${sessionId}/questions`),
}

export const reportAPI = {
  generateReport: (sessionId) => api.post(`/reports/generate/${sessionId}`),
  getReport:      (sessionId) => api.get(`/reports/${sessionId}`),
  listReports:    ()          => api.get('/reports/'),
}

export default api
