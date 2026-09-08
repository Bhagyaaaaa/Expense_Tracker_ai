// api.js
// A tiny wrapper around fetch() so every other file can call, say,
// api.getExpenses() instead of repeating headers/error-handling everywhere.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // DELETE returns 204 No Content, so there's no JSON body to parse.
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    throw new Error((data && data.error) || 'Something went wrong');
  }
  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getExpenses: () => request('/expenses'),
  addExpense: (body) => request('/expenses', { method: 'POST', body: JSON.stringify(body) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  askAi: (question) => request('/chat', { method: 'POST', body: JSON.stringify({ question }) }),
};
