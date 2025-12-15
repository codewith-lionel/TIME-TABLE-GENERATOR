import React, { useState, useEffect } from 'react';

const GlobalSettings = () => {
  const [settings, setSettings] = useState({
    numDayOrders: 5,
    hoursPerDay: 6,
    breakHours: []
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await window.api.getGlobalSettings();
    if (result.success && result.data) {
      setSettings(result.data);
    }
  };

  const handleSave = async () => {
    const result = await window.api.saveGlobalSettings(settings);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Error saving settings: ' + result.error);
    }
  };

  const handleBreakHoursChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setSettings({ ...settings, breakHours: [] });
      return;
    }
    const hours = value.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h));
    setSettings({ ...settings, breakHours: hours });
  };

  return (
    <div className="panel">
      <h2>⚙️ Global Settings</h2>
      <p className="description">Configure the basic parameters for timetable generation</p>

      <div className="form-section">
        <div className="form-group">
          <label>Number of Day Orders</label>
          <input
            type="number"
            min="1"
            max="10"
            value={settings.numDayOrders}
            onChange={(e) => setSettings({ ...settings, numDayOrders: parseInt(e.target.value) })}
            className="input"
          />
          <small>Example: 5 (Day 1, Day 2, Day 3, Day 4, Day 5)</small>
        </div>

        <div className="form-group">
          <label>Hours Per Day</label>
          <input
            type="number"
            min="1"
            max="12"
            value={settings.hoursPerDay}
            onChange={(e) => setSettings({ ...settings, hoursPerDay: parseInt(e.target.value) })}
            className="input"
          />
          <small>Total teaching hours including breaks</small>
        </div>

        <div className="form-group">
          <label>Break Hours (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g., 3,4 for breaks at hour 3 and 4"
            value={settings.breakHours.join(', ')}
            onChange={handleBreakHoursChange}
            className="input"
          />
          <small>Optional: Specify which hours are breaks (e.g., 3,4)</small>
        </div>

        <button onClick={handleSave} className="btn btn-primary">
          💾 Save Settings
        </button>

        {saved && <div className="success-message">✅ Settings saved successfully!</div>}
      </div>
    </div>
  );
};

export default GlobalSettings;
