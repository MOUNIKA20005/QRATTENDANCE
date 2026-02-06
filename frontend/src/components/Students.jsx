import React from "react";

export default function Students({ users }) {
  const students = users.filter((u) => u.role === "student");

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Students</h2>

      {students.length === 0 ? (
        <p>No students found</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {students.map((u, index) => (
              <tr key={u._id || u.email}>
                <td>{index + 1}</td>
                <td>{u.name || "N/A"}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}