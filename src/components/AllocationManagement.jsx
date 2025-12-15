import React, { useState, useEffect } from 'react';

const AllocationManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [subjectsResult, teachersResult, allocationsResult] = await Promise.all([
      window.api.getSubjects(),
      window.api.getTeachers(),
      window.api.getAllocations()
    ]);

    if (subjectsResult.success) setSubjects(subjectsResult.data);
    if (teachersResult.success) setTeachers(teachersResult.data);
    if (allocationsResult.success) setAllocations(allocationsResult.data);
  };

  const getUnallocatedSubjects = () => {
    const allocatedSubjectIds = new Set(allocations.map(a => a.subject_id));
    return subjects.filter(s => !allocatedSubjectIds.has(s.id));
  };

  const handleAdd = async () => {
    if (!formData.subjectId || !formData.teacherId) {
      alert('Please select both subject and teacher');
      return;
    }

    const result = await window.api.saveAllocation({
      subjectId: parseInt(formData.subjectId),
      teacherId: parseInt(formData.teacherId)
    });

    if (result.success) {
      setFormData({ subjectId: '', teacherId: '' });
      loadData();
    } else {
      alert('Error creating allocation: ' + result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this allocation?')) {
      return;
    }

    const result = await window.api.deleteAllocation(id);
    if (result.success) {
      loadData();
    } else {
      alert('Error deleting allocation: ' + result.error);
    }
  };

  const groupByClass = () => {
    const grouped = {};
    allocations.forEach(allocation => {
      if (!grouped[allocation.class_name]) {
        grouped[allocation.class_name] = [];
      }
      grouped[allocation.class_name].push(allocation);
    });
    return grouped;
  };

  const unallocatedSubjects = getUnallocatedSubjects();
  const groupedAllocations = groupByClass();

  return (
    <div className="panel">
      <h2>🔗 Subject-Teacher Allocation</h2>
      <p className="description">Allocate teachers to subjects. Each subject must be assigned to exactly one teacher.</p>

      {subjects.length === 0 || teachers.length === 0 ? (
        <div className="warning-message">
          ⚠️ Please add subjects and teachers before creating allocations.
        </div>
      ) : (
        <>
          {unallocatedSubjects.length > 0 && (
            <div className="form-section">
              <h3>Create New Allocation</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Subject</option>
                    {unallocatedSubjects.map(subject => {
                      const cls = subjects.find(s => s.id === subject.id);
                      return (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({cls ? cls.class_id : 'Unknown Class'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label>Teacher</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button onClick={handleAdd} className="btn btn-primary">
                ➕ Create Allocation
              </button>
            </div>
          )}

          <div className="list-section">
            <h3>Current Allocations ({allocations.length})</h3>
            
            {allocations.length === 0 ? (
              <p className="empty-message">No allocations created yet.</p>
            ) : (
              <div className="allocations-container">
                {Object.entries(groupedAllocations).map(([className, classAllocations]) => (
                  <div key={className} className="allocation-class-group">
                    <h4 className="class-heading">📘 {className}</h4>
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Teacher</th>
                            <th>Weekly Hours</th>
                            <th>Priority</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classAllocations.map(allocation => (
                            <tr key={allocation.id}>
                              <td><strong>{allocation.subject_name}</strong></td>
                              <td>{allocation.teacher_name}</td>
                              <td>{allocation.weekly_hours}</td>
                              <td>
                                <span className={`badge badge-${allocation.priority.toLowerCase()}`}>
                                  {allocation.priority}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => handleDelete(allocation.id)}
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
                  </div>
                ))}
              </div>
            )}

            {unallocatedSubjects.length > 0 && (
              <div className="info-message">
                ℹ️ {unallocatedSubjects.length} subject(s) still need teacher allocation.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AllocationManagement;
