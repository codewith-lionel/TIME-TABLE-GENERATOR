import React, { useState, useEffect } from 'react';

const TeacherWorkload = () => {
  const [workload, setWorkload] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [workloadResult, settingsResult] = await Promise.all([
      window.api.getTeacherWorkload(),
      window.api.getGlobalSettings()
    ]);

    if (workloadResult.success) {
      setWorkload(workloadResult.data);
    }
    if (settingsResult.success) {
      setSettings(settingsResult.data);
    }
  };

  const handleExport = async (format) => {
    const result = await window.api.exportTimetable({
      format,
      type: 'teacher-workload'
    });

    if (result.success) {
      alert(`✅ Exported successfully to: ${result.filePath}`);
    } else {
      alert('❌ Export error: ' + result.error);
    }
  };

  const getWorkloadStatus = (weeklyHours, maxHoursPerDay) => {
    const avgDailyHours = settings ? weeklyHours / settings.numDayOrders : 0;
    
    if (avgDailyHours >= maxHoursPerDay * 0.9) {
      return { status: 'high', label: 'High Load', color: 'red' };
    } else if (avgDailyHours >= maxHoursPerDay * 0.6) {
      return { status: 'medium', label: 'Medium Load', color: 'orange' };
    } else {
      return { status: 'low', label: 'Low Load', color: 'green' };
    }
  };

  if (!settings) {
    return (
      <div className="panel">
        <h2>📊 Teacher Workload</h2>
        <div className="warning-message">
          ⚠️ Please configure global settings first.
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>📊 Teacher Workload Report</h2>
      <p className="description">View teacher schedules and workload distribution</p>

      <div className="toolbar">
        <button onClick={() => loadData()} className="btn btn-secondary">
          🔄 Refresh
        </button>
        <div className="toolbar-section">
          <button onClick={() => handleExport('pdf')} className="btn btn-primary">
            📄 Export PDF
          </button>
          <button onClick={() => handleExport('excel')} className="btn btn-primary">
            📊 Export Excel
          </button>
        </div>
      </div>

      {workload.length === 0 ? (
        <div className="empty-message">
          No timetable data available. Please generate a timetable first.
        </div>
      ) : (
        <div className="workload-container">
          {workload.map(teacher => {
            const status = getWorkloadStatus(teacher.weeklyHours, teacher.maxHoursPerDay);
            
            return (
              <div key={teacher.teacherId} className="workload-card">
                <div className="workload-header">
                  <h3>{teacher.teacherName}</h3>
                  <span className={`workload-badge badge-${status.status}`}>
                    {status.label}
                  </span>
                </div>

                <div className="workload-stats">
                  <div className="stat-item">
                    <span className="stat-label">Weekly Hours:</span>
                    <span className="stat-value">{teacher.weeklyHours}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Max Hours/Day:</span>
                    <span className="stat-value">{teacher.maxHoursPerDay}</span>
                  </div>
                </div>

                <div className="daily-hours">
                  <h4>Daily Hours Distribution</h4>
                  <div className="daily-hours-grid">
                    {Array.from({ length: settings.numDayOrders }, (_, i) => {
                      const day = i + 1;
                      const hours = teacher.dailyHours[day] || 0;
                      const percentage = (hours / teacher.maxHoursPerDay) * 100;
                      
                      return (
                        <div key={day} className="daily-hour-item">
                          <div className="day-label">Day {day}</div>
                          <div className="hour-bar-container">
                            <div 
                              className="hour-bar"
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: percentage >= 100 ? 'red' : percentage >= 80 ? 'orange' : 'green'
                              }}
                            />
                          </div>
                          <div className="hour-value">{hours} hrs</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="subjects-section">
                  <h4>Subjects Teaching</h4>
                  <div className="subjects-list">
                    {teacher.subjects.length === 0 ? (
                      <span className="empty-text">No subjects assigned</span>
                    ) : (
                      teacher.subjects.map((subject, idx) => (
                        <span key={idx} className="subject-tag">{subject}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="summary-section">
        <h3>Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Teachers:</span>
            <span className="summary-value">{workload.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Weekly Hours:</span>
            <span className="summary-value">
              {workload.reduce((sum, t) => sum + t.weeklyHours, 0)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Average Load:</span>
            <span className="summary-value">
              {workload.length > 0 
                ? (workload.reduce((sum, t) => sum + t.weeklyHours, 0) / workload.length).toFixed(1)
                : 0} hrs/week
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherWorkload;
