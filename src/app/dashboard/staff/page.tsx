'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCards';
import { AIAlerts } from '@/components/dashboard/AIAlerts';
import { User } from '@/types/user';
import { Clock, Calendar, Briefcase, FileCheck2 } from 'lucide-react';
import { scheduleService } from '@/services/scheduleService';
import { Schedule } from '@/types/schedule';

export default function StaffDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      const data = await scheduleService.getSchedules();
      setSchedules(data);
    };

    void loadSchedules();
  }, []);

  const todayStats = useMemo(() => {
    const parseMinutes = (time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return null;
      }
      return hour * 60 + minute;
    };

    const formatHourMinute = (time: string) => {
      const minutes = parseMinutes(time);
      if (minutes === null) {
        return 'N/A';
      }

      const hour24 = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const period = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const accountName = (user as User & { full_name?: string } | null)?.full_name ?? '';
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const ownShiftsToday = schedules
      .filter((schedule) => {
        if (schedule.type !== 'shift') {
          return false;
        }

        if (schedule.dayOfWeek !== currentDay) {
          return false;
        }

        return !!accountName && schedule.employeeName === accountName;
      })
      .sort((a, b) => (parseMinutes(a.startTime) ?? 0) - (parseMinutes(b.startTime) ?? 0));

    const totalMinutes = ownShiftsToday.reduce((total, schedule) => {
      const start = parseMinutes(schedule.startTime);
      const end = parseMinutes(schedule.endTime);

      if (start === null || end === null || end <= start) {
        return total;
      }

      return total + (end - start);
    }, 0);

    const currentShift = ownShiftsToday.find((schedule) => {
      const start = parseMinutes(schedule.startTime);
      const end = parseMinutes(schedule.endTime);
      return start !== null && end !== null && nowMinutes >= start && nowMinutes < end;
    });

    const nextShift = ownShiftsToday.find((schedule) => {
      const start = parseMinutes(schedule.startTime);
      return start !== null && start > nowMinutes;
    });

    const totalHours = totalMinutes / 60;
    const totalHoursLabel = Number.isInteger(totalHours) ? `${totalHours.toFixed(0)}h` : `${totalHours.toFixed(1)}h`;

    return {
      currentShift: currentShift?.subjectOrRole ?? 'No active shift',
      totalHoursLabel,
      nextShiftTime: nextShift ? formatHourMinute(nextShift.startTime) : 'No more today',
      nextShiftRole: nextShift?.subjectOrRole || 'No upcoming shift',
    };
  }, [schedules, user]);

  const mockAlerts = [
    {
      id: '1',
      type: 'insight' as const,
      title: 'Shift Change Request',
      message: 'Sarah Wilson has requested to swap shifts for next Friday.',
    },
    {
      id: '2',
      type: 'warning' as const,
      title: 'Pending HR Compliance',
      message: 'Your safety training module expires in 7 days.',
      recommendation: 'Complete the online module now.'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome, {user?.full_name}. Here&apos;s your shift overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Current Shift" value={todayStats.currentShift} icon={Clock} href="/schedules" />
        <StatCard title="Hours Logged" value={todayStats.totalHoursLabel} description="Today" icon={Briefcase} href="/schedules" />
        <StatCard title="Next Shift" value={todayStats.nextShiftTime} description={todayStats.nextShiftRole} icon={Calendar} href="/schedules" />
        <StatCard title="Compliance Score" value="95%" icon={FileCheck2} trend="down" trendValue="5%" href="/clearance" />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 lg:col-span-5 space-y-6">
          <AIAlerts alerts={mockAlerts} />
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Work Shift Schedule</h3>
            <div className="space-y-4">
              {['Monday: 08:00 - 17:00 (Office Duty)', 'Tuesday: 08:00 - 17:00 (Office Duty)', 'Wednesday: 08:00 - 17:00 (Office Duty)'].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-3 lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <h3 className="font-semibold text-slate-800 mb-2">Today&apos;s Log</h3>
              <div className="text-3xl font-bold text-slate-900 my-4">ON DUTY</div>
              <div className="text-sm text-slate-500">Clocked in at 07:55 AM</div>
           </div>
        </div>
      </div>
    </div>
  );
}