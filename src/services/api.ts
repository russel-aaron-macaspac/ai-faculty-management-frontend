import axios from 'axios';

// Currently we use a simple set of mock data and mocked functions instead of real API calls,
// but we set up an axios instance to easily transition to a real backend.
export const api = axios.create({
  baseURL: '/api', // Change this to real backend URL later
  headers: {
    'Content-Type': 'application/json',
  },
});

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
