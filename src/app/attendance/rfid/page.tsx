import Link from "next/link";

export default function RFIDAttendancePage() {
  const stats = {
    totalScans: 24,
    validAttendance: 20,
    anomalies: 4,
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <Link href="/attendance" style={backButtonStyle}>
          ← Back to Attendance
        </Link>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        RFID Attendance Dashboard
      </h1>

      <p style={{ marginTop: "8px", color: "#555" }}>
        Monitor RFID-based attendance for faculty and staff.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        <div style={cardStyle}>
          <h3>Total Scans Today</h3>
          <p style={numberStyle}>{stats.totalScans}</p>
        </div>

        <div style={cardStyle}>
          <h3>Valid Attendance</h3>
          <p style={numberStyle}>{stats.validAttendance}</p>
        </div>

        <div style={cardStyle}>
          <h3>Anomalies Detected</h3>
          <p style={numberStyle}>{stats.anomalies}</p>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h2>Quick Links</h2>

        <ul style={{ marginTop: "10px" }}>
          <li>
            <a href="/attendance/rfid/live">View Live RFID Monitor</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#f5f5f5",
  padding: "20px",
  borderRadius: "10px",
};

const numberStyle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: "bold",
};

const backButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  color: "#334155",
  textDecoration: "none",
  fontWeight: 600,
  background: "#fff",
};