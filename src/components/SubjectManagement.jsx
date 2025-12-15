import React, { useState, useEffect } from 'react';

const SubjectManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    weeklyHours: 3,
    priority: 'MEDIUM'
  });

  useEffect(() => {
    loadClasses();
    loadSubjects();
  }, []);

  const loadClasses = async () => {
    const result = await window.api.getClasses();
    if (result.success) {
      setClasses(result.data);
      if (result.data.length > 0 && !formData.classId) {
        setFormData({ ...formData, classId: result.data[0].id });
      }
    }
  };

  const loadSubjects = async () => {
    const result = await window.api.getSubjects();
    if (result.success) {
      setSubjects(result.data);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.classId) {
      alert('Please fill in all fields');
      return;
    }

    const result = await window.api.saveSubject(formData);
    if (result.success) {
      setFormData({ name: '', classId: formData.classId, weeklyHours: 3, priority: 'MEDIUM' });
      loadSubjects();
    } else {
      alert('Error adding subject: ' + result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) {
      return;
    }

    const result = await window.api.deleteSubject(id);
    if (result.success) {
      loadSubjects();
    } else {
      alert('Error deleting subject: ' + result.error);
    }
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : '';
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      HIGH: 'badge-high',
      MEDIUM: 'badge-medium',
      LOW: 'badge-low'
    };
    return <span className={`badge ${colors[priority]}`}>{priority}</span>;
  };

  return (
    <div className="panel">
      <h2>📚 Subject Management</h2>
      <p className="description">Add subjects for each class with their weekly hours and priority</p>

      {classes.length === 0 ? (
        <div className="warning-message">
          ⚠️ Please add at least one class first before adding subjects.
        </div>
      ) : (
        <>
          <div className="form-section">
            <div className="form-grid">
              <div className="form-group">
                <label>Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics, Physics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label>Class</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: parseInt(e.target.value) })}
                  className="input"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Weekly Hours</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.weeklyHours}
                  onChange={(e) => setFormData({ ...formData, weeklyHours: parseInt(e.target.value) })}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input"
                >
                  <option value="HIGH">HIGH (Core/Lab)</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <button onClick={handleAdd} className="btn btn-primary">
              ➕ Add Subject
            </button>
          </div>

          <div className="list-section">
            <h3>Subjects ({subjects.length})</h3>
            {subjects.length === 0 ? (
              <p className="empty-message">No subjects added yet.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Class</th>
                      <th>Weekly Hours</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map(subject => (
                      <tr key={subject.id}>
                        <td><strong>{subject.name}</strong></td>
                        <td>{getClassName(subject.class_id)}</td>
                        <td>{subject.weekly_hours}</td>
                        <td>{getPriorityBadge(subject.priority)}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(subject.id)}
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
        </>
      )}
    </div>
  );
};

export default SubjectManagement;
