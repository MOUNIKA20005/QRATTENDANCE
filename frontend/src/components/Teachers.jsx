import React from "react";

export default function Teachers({ users }) {
  const teachers = users.filter((u) => u.role === "teacher");

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Teachers</h2>

      {teachers.length === 0 ? (
        <p>No teachers found</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((u, index) => (
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