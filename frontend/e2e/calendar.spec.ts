import { test, expect } from '@playwright/test';

test.describe('Calendar Appointment Pagination', () => {
  test('correctly fetches and displays all appointments across 24h at 15m intervals', async ({ page }) => {
    const mockAppointments: any[] = [];
    // Start with Monday of the current week to match the calendar's default view
    const baseDate = new Date();
    const dayOfWeek = baseDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    baseDate.setDate(baseDate.getDate() + diff);
    
    // Generate appointments for 7 days
    for (let d = 0; d < 7; d++) {
      const currentDay = new Date(baseDate);
      currentDay.setDate(baseDate.getDate() + d);
      
      const y = currentDay.getFullYear();
      const m = String(currentDay.getMonth() + 1).padStart(2, '0');
      const dayStr = String(currentDay.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayStr}`;
      
      // 00:00 to 23:45 every 15 mins
      for (let h = 0; h < 24; h++) {
        for (let min = 0; min < 60; min += 15) {
          const timeStr = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
          mockAppointments.push({
            id: d * 100 + h * 4 + min/15,
            patient_name: `Patient ${dateStr} ${timeStr}`,
            doctor_name: 'Dr. Test',
            date: dateStr,
            time: timeStr,
            status: 'scheduled',
            notes: ''
          });
        }
      }
    }

    // Catch ALL API requests to prevent ERR_CONNECTION_REFUSED
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      
      if (url.pathname.includes('/settings')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
             work_start_time: "09:00:00",
             work_end_time: "20:00:00",
             work_days: [0, 1, 2, 3, 4, 5, 6] 
          })
        });
      } else if (url.pathname.includes('/treatments') || url.pathname.includes('/users')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (url.pathname.includes('/appointments')) {
        const dateParam = url.searchParams.get('date');
        if (dateParam) {
          const filtered = mockAppointments.filter(a => a.date === dateParam);
          const pageNum = parseInt(url.searchParams.get('page') || '1', 10);
          const limit = 15;
          const start = (pageNum - 1) * limit;
          const end = start + limit;
          const paginated = filtered.slice(start, end);
          const next = end < filtered.length ? `${url.origin}${url.pathname}?date=${dateParam}&page=${pageNum + 1}` : null;
          
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              count: filtered.length,
              next: next,
              previous: null,
              results: paginated
            })
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
        }
      } else {
        await route.continue();
      }
    });

    // Navigate to login page first to have an origin and wait for it
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // Mock auth so we can bypass login
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'fake-token');
      localStorage.setItem('tenant_id', 'demo');
      localStorage.setItem('user_role', 'admin');
    });

    // Navigate to calendar
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    await page.goto('http://localhost:5173/dashboard/calendar');

    // Wait for the UI to render the appointments
    await page.waitForTimeout(3000);

    // Let's check a random late appointment for Monday
    const monday = new Date(baseDate);
    const my = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    const md = String(monday.getDate()).padStart(2, '0');
    const monStr = `${my}-${mm}-${md}`;

    // Expect the 17:00 appointment to be visible!
    const fivePmAppt = page.getByText(`Patient ${monStr} 17:00:00`);
    await expect(fivePmAppt).toBeVisible();

    // Expect the 23:45 appointment to be visible!
    const lateAppt = page.getByText(`Patient ${monStr} 23:45:00`);
    await expect(lateAppt).toBeVisible();
  });
});
