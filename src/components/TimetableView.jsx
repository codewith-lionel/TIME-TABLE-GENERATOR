import React, { useState, useEffect } from 'react';

const TimetableView = ({ onGenerated }) => {
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [classesResult, settingsResult, timetableResult, subjectsResult, teachersResult, allocationsResult] = 
      await Promise.all([
        window.api.getClasses(),
        window.api.getGlobalSettings(),
        window.api.getTimetable(),
        window.api.getSubjects(),
        window.api.getTeachers(),
        window.api.getAllocations()
      ]);

    if (classesResult.success) {
      setClasses(classesResult.data);
      if (classesResult.data.length > 0 && !selectedClass) {
        setSelectedClass(classesResult.data[0].id);
      }
    }
    if (settingsResult.success) setSettings(settingsResult.data);
    if (timetableResult.success) setTimetable(timetableResult.data);
    if (subjectsResult.success) setSubjects(subjectsResult.data);
    if (teachersResult.success) setTeachers(teachersResult.data);
    if (allocationsResult.success) setAllocations(allocationsResult.data);
  };

  const handleGenerate = async () => {
    if (!confirm('Generate new timetable? This will replace any existing timetable.')) {
      return;
    }

    setGenerating(true);
    const result = await window.api.generateTimetable();
    setGenerating(false);

    if (result.success) {
      setStats(result.stats);
      loadData();
      onGenerated();
      alert('✅ Timetable generated successfully!');
    } else {
      alert('❌ Error generating timetable: ' + result.error);
    }
  };

  const handleExport = async (format, type) => {
    const result = await window.api.exportTimetable({
      format,
      type,
      classId: type === 'class-timetable' ? selectedClass : null
    });

    if (result.success) {
      alert(`✅ Exported successfully to: ${result.filePath}`);
    } else {
      alert('❌ Export error: ' + result.error);
    }
  };

  const handleCellEdit = async (classId, dayOrder, hour, currentEntry) => {
    if (!editMode) return;

    // Get available subjects and teachers for this class
    const classSubjects = subjects.filter(s => s.class_id === classId);
    const classAllocations = allocations.filter(a => classSubjects.some(s => s.id === a.subject_id));

    if (classAllocations.length === 0) {
      alert('No allocations available for this class');
      return;
    }

    // Create selection dialog
    const options = ['Clear Slot', ...classAllocations.map(a => 
      `${a.subject_name} (${a.teacher_name})`
    )];
    
    const selection = prompt(
      `Edit slot for Day ${dayOrder}, Hour ${hour}:\n\n` +
      options.map((opt, idx) => `${idx}: ${opt}`).join('\n') +
      `\n\nEnter number (0 to clear):`
    );

    if (selection === null) return;

    const index = parseInt(selection);
    if (isNaN(index) || index < 0 || index > classAllocations.length) {
      alert('Invalid selection');
      return;
    }

    let subjectId = null;
    let teacherId = null;

    if (index > 0) {
      const allocation = classAllocations[index - 1];
      subjectId = allocation.subject_id;
      teacherId = allocation.teacher_id;
    }

    const result = await window.api.updateTimetableSlot({
      classId,
      dayOrder,
      hour,
      subjectId,
      teacherId
    });

    if (result.success) {
      loadData();
    } else {
      alert('❌ ' + result.error);
    }
  };

  const getClassTimetable = () => {
    if (!selectedClass) return [];
    return timetable.filter(entry => entry.class_id === selectedClass);
  };

  const getCellContent = (dayOrder, hour) => {
    const classTimetable = getClassTimetable();
    const entry = classTimetable.find(e => e.day_order === dayOrder && e.hour === hour);
    
    if (settings && settings.breakHours.includes(hour)) {
      return { type: 'break' };
    }
    
    if (entry && entry.subject_name) {
      return {
        type: 'class',
        subject: entry.subject_name,
        teacher: entry.teacher_name,
        priority: entry.priority,
        entry: entry
      };
    }
    
    return { type: 'empty' };
  };

  const renderCell = (dayOrder, hour) => {
    const content = getCellContent(dayOrder, hour);
    
    if (content.type === 'break') {
      return (
        <td key={`${dayOrder}-${hour}`} className="timetable-cell break-cell">
          <div className="cell-content">BREAK</div>
        </td>
      );
    }
    
    if (content.type === 'empty') {
      return (
        <td 
          key={`${dayOrder}-${hour}`} 
          className={`timetable-cell empty-cell ${editMode ? 'editable' : ''}`}
          onClick={() => editMode && handleCellEdit(selectedClass, dayOrder, hour, null)}
        >
          <div className="cell-content">-</div>
        </td>
      );
    }
    
    return (
      <td 
        key={`${dayOrder}-${hour}`} 
        className={`timetable-cell filled-cell priority-${content.priority?.toLowerCase()} ${editMode ? 'editable' : ''}`}
        onClick={() => editMode && handleCellEdit(selectedClass, dayOrder, hour, content.entry)}
      >
        <div className="cell-content">
          <div className="subject-name">{content.subject}</div>
          <div className="teacher-name">{content.teacher}</div>
        </div>
      </td>
    );
  };

  if (!settings) {
    return (
      <div className="panel">
        <h2>📅 Timetable</h2>
        <div className="warning-message">
          ⚠️ Please configure global settings first.
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="panel">
        <h2>📅 Timetable</h2>
        <div className="warning-message">
          ⚠️ Please add classes before generating timetable.
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>📅 Timetable</h2>
      
      <div className="toolbar">
        <div className="toolbar-section">
          <button 
            onClick={handleGenerate} 
            disabled={generating}
            className="btn btn-primary btn-lg"
          >
            {generating ? '⏳ Generating...' : '🔄 Generate Timetable'}
          </button>
          
          <button
            onClick={() => setEditMode(!editMode)}
            className={`btn ${editMode ? 'btn-warning' : 'btn-secondary'}`}
          >
            {editMode ? '🔒 Lock Editing' : '✏️ Enable Editing'}
          </button>
        </div>

        <div className="toolbar-section">
          <div className="dropdown">
            <button className="btn btn-secondary">📥 Export</button>
            <div className="dropdown-content">
              <a onClick={() => handleExport('pdf', 'class-timetable')}>PDF - Current Class</a>
              <a onClick={() => handleExport('pdf', 'all-timetables')}>PDF - All Classes</a>
              <a onClick={() => handleExport('excel', 'class-timetable')}>Excel - Current Class</a>
              <a onClick={() => handleExport('excel', 'all-timetables')}>Excel - All Classes</a>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <div className="stats-panel">
          <h3>Generation Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Slots:</span>
              <span className="stat-value">{stats.totalSlots}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Filled Slots:</span>
              <span className="stat-value">{stats.filledSlots}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Utilization:</span>
              <span className="stat-value">{stats.utilizationRate}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Preference Match:</span>
              <span className="stat-value">{stats.preferenceMatchRate}</span>
            </div>
          </div>
        </div>
      )}

      {editMode && (
        <div className="info-message">
          ℹ️ Edit Mode Active: Click on any cell to modify it. Changes are validated for teacher clashes and daily limits.
        </div>
      )}

      <div className="class-selector">
        <label>Select Class:</label>
        {classes.map(cls => (
          <button
            key={cls.id}
            onClick={() => setSelectedClass(cls.id)}
            className={`btn ${selectedClass === cls.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      <div className="timetable-container">
        <table className="timetable">
          <thead>
            <tr>
              <th className="header-cell">Hour</th>
              {Array.from({ length: settings.numDayOrders }, (_, i) => (
                <th key={i + 1} className="header-cell">Day {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: settings.hoursPerDay }, (_, hourIdx) => {
              const hour = hourIdx + 1;
              return (
                <tr key={hour}>
                  <td className="hour-label">Hour {hour}</td>
                  {Array.from({ length: settings.numDayOrders }, (_, dayIdx) => {
                    const day = dayIdx + 1;
                    return renderCell(day, hour);
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableView;
