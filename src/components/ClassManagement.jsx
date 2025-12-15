import React, { useState, useEffect } from 'react';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const result = await window.api.getClasses();
    if (result.success) {
      setClasses(result.data);
    }
  };

  const handleAdd = async () => {
    if (!newClassName.trim()) {
      alert('Please enter a class name');
      return;
    }

    const result = await window.api.saveClass({ name: newClassName });
    if (result.success) {
      setNewClassName('');
      loadClasses();
    } else {
      alert('Error adding class: ' + result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this class? This will also delete associated subjects.')) {
      return;
    }

    const result = await window.api.deleteClass(id);
    if (result.success) {
      loadClasses();
    } else {
      alert('Error deleting class: ' + result.error);
    }
  };

  return (
    <div className="panel">
      <h2>🏫 Class Management</h2>
      <p className="description">Add and manage classes/departments/years</p>

      <div className="form-section">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter class name (e.g., First Year, Second Year)"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            className="input flex-grow"
          />
          <button onClick={handleAdd} className="btn btn-primary">
            ➕ Add Class
          </button>
        </div>
      </div>

      <div className="list-section">
        <h3>Classes ({classes.length})</h3>
        {classes.length === 0 ? (
          <p className="empty-message">No classes added yet. Add your first class above.</p>
        ) : (
          <div className="list">
            {classes.map(cls => (
              <div key={cls.id} className="list-item">
                <div className="list-item-content">
                  <strong>{cls.name}</strong>
                </div>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="btn btn-danger btn-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManagement;
