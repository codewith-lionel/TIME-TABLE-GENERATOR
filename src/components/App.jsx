import React, { useState } from 'react';
import GlobalSettings from './GlobalSettings';
import ClassManagement from './ClassManagement';
import SubjectManagement from './SubjectManagement';
import TeacherManagement from './TeacherManagement';
import AllocationManagement from './AllocationManagement';
import TimetableView from './TimetableView';
import TeacherWorkload from './TeacherWorkload';

const App = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [timetableGenerated, setTimetableGenerated] = useState(false);

  const tabs = [
    { id: 'settings', label: 'Global Settings', icon: '⚙️' },
    { id: 'classes', label: 'Classes', icon: '🏫' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'allocations', label: 'Allocations', icon: '🔗' },
    { id: 'timetable', label: 'Timetable', icon: '📅' },
    { id: 'workload', label: 'Teacher Workload', icon: '📊' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return <GlobalSettings />;
      case 'classes':
        return <ClassManagement />;
      case 'subjects':
        return <SubjectManagement />;
      case 'teachers':
        return <TeacherManagement />;
      case 'allocations':
        return <AllocationManagement />;
      case 'timetable':
        return <TimetableView onGenerated={() => setTimetableGenerated(true)} />;
      case 'workload':
        return <TeacherWorkload />;
      default:
        return <GlobalSettings />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎓 Advanced Timetable Generator</h1>
        <p>Multi-Class Constraint-Based Scheduling System</p>
      </header>

      <div className="app-container">
        <nav className="sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
