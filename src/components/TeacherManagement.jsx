import React, { useState, useEffect } from "react";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    maxHoursPerDay: 5,
    preferredDayOrders: [],
    preferredTimeSlots: {
      morning: false,
      afternoon: false,
      specific: [],
    },
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    const result = await window.api.getTeachers();
    if (result.success) {
      setTeachers(result.data);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      alert("Please enter teacher name");
      return;
    }

    const result = await window.api.saveTeacher(formData);
    if (result.success) {
      setFormData({
        name: "",
        maxHoursPerDay: 5,
        preferredDayOrders: [],
        preferredTimeSlots: { morning: false, afternoon: false, specific: [] },
      });
      setShowForm(false);
      loadTeachers();
    } else {
      alert("Error adding teacher: " + result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this teacher?")) {
      return;
    }

    const result = await window.api.deleteTeacher(id);
    if (result.success) {
      loadTeachers();
    } else {
      alert("Error deleting teacher: " + result.error);
    }
  };

  const handleDayOrderToggle = (day) => {
    const days = [...formData.preferredDayOrders];
    const index = days.indexOf(day);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    setFormData({ ...formData, preferredDayOrders: days.sort() });
  };

  const formatPreferences = (teacher) => {
    const prefs = [];
    if (teacher.preferredDayOrders && teacher.preferredDayOrders.length > 0) {
      prefs.push(`Days: ${teacher.preferredDayOrders.join(", ")}`);
    }
    if (teacher.preferredTimeSlots) {
      if (teacher.preferredTimeSlots.morning) prefs.push("Morning");
      if (teacher.preferredTimeSlots.afternoon) prefs.push("Afternoon");
    }
    return prefs.length > 0 ? prefs.join(" | ") : "No preferences";
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      maxHoursPerDay: 5,
      preferredDayOrders: [],
      preferredTimeSlots: { morning: false, afternoon: false, specific: [] },
    });
    setShowForm(false);
  };

  return (
    <div className="panel">
      <h2>👨‍🏫 Teacher Management</h2>
      <p className="description">
        Manage teachers with their constraints and preferences
      </p>

      <div className="form-section">
        <button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          className="btn btn-primary"
        >
          {showForm ? "❌ Cancel" : "➕ Add Teacher"}
        </button>

        {showForm && (
          <div className="form-card">
            <div className="form-group">
              <label>Teacher Name</label>
              <input
                type="text"
                placeholder="e.g., Dr. John Smith"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Maximum Hours Per Day</label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.maxHoursPerDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxHoursPerDay: parseInt(e.target.value),
                  })
                }
                className="input"
              />
              <small>Hard constraint - teacher cannot exceed this limit</small>
            </div>

            <div className="form-group">
              <label>Preferred Day Orders (Optional)</label>
              <div className="checkbox-group">
                {[1, 2, 3, 4, 5].map((day) => (
                  <label key={day} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.preferredDayOrders.includes(day)}
                      onChange={() => handleDayOrderToggle(day)}
                    />
                    Day {day}
                  </label>
                ))}
              </div>
              <small>Soft constraint - teacher prefers these days</small>
            </div>

            <div className="form-group">
              <label>Preferred Time Slots (Optional)</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.preferredTimeSlots.morning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredTimeSlots: {
                          ...formData.preferredTimeSlots,
                          morning: e.target.checked,
                        },
                      })
                    }
                  />
                  Morning
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.preferredTimeSlots.afternoon}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredTimeSlots: {
                          ...formData.preferredTimeSlots,
                          afternoon: e.target.checked,
                        },
                      })
                    }
                  />
                  Afternoon
                </label>
              </div>
              <small>Soft constraint - teacher prefers these time slots</small>
            </div>

            <button onClick={handleAdd} className="btn btn-success">
              💾 Save Teacher
            </button>
          </div>
        )}
      </div>

      <div className="list-section">
        <h3>Teachers ({teachers.length})</h3>
        {teachers.length === 0 ? (
          <p className="empty-message">No teachers added yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Teacher Name</th>
                  <th>Max Hours/Day</th>
                  <th>Preferences</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>
                      <strong>{teacher.name}</strong>
                    </td>
                    <td>{teacher.max_hours_per_day}</td>
                    <td>
                      <small>{formatPreferences(teacher)}</small>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;
