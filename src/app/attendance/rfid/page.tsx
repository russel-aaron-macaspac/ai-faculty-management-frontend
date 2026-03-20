import { redirect } from 'next/navigation';

export default function RFIDAttendancePage() {
  redirect('/attendance/rfid/live');
}