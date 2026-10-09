import { API_BASE } from './api';

function postForm(url, data) {
  const body = new URLSearchParams(data);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackPageview(pathname = window.location.pathname) {
  return postForm(`${API_BASE}/track/event`, { type: 'PAGEVIEW', meta: pathname });
}

export function trackClick(label) {
  return postForm(`${API_BASE}/track/event`, { type: 'CLICK', meta: label });
}
