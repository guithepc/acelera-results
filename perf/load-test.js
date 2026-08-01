import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      startTime: '0s',
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '60s', target: 100 },
        { duration: '15s', target: 0 },
      ],
      startTime: '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
    'http_req_duration{name:students}': ['p(95)<300'],
    'http_req_duration{name:stats}': ['p(95)<300'],
    'http_req_duration{name:card}': ['p(95)<400'],
    'http_req_duration{name:admin}': ['p(95)<400'],
  },
};

export default function () {
  const studentsRes = http.get(`${BASE_URL}/api/students`, { tags: { name: 'students' } });
  check(studentsRes, {
    'students 200': r => r.status === 200,
  });

  const statsRes = http.get(`${BASE_URL}/api/students/stats`, { tags: { name: 'stats' } });
  check(statsRes, {
    'stats 200': r => r.status === 200,
  });

  if (studentsRes.status === 200) {
    const students = studentsRes.json();
    if (Array.isArray(students) && students.length > 0) {
      const id = students[Math.floor(Math.random() * students.length)].id;
      const cardRes = http.get(`${BASE_URL}/api/students/${id}`, { tags: { name: 'card' } });
      check(cardRes, {
        'card 200': r => r.status === 200,
      });
    }
  }

  const adminToken = __ENV.ADMIN_TOKEN;
  if (adminToken) {
    const adminRes = http.get(`${BASE_URL}/api/admin/students`, {
      headers: { 'X-Admin-Token': adminToken },
      tags: { name: 'admin' },
    });
    check(adminRes, {
      'admin 200': r => r.status === 200,
    });
  }

  sleep(1);
}
