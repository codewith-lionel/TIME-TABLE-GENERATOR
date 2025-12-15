# Quick Start Guide

## For End Users

### Installation

1. **Download** the application installer
2. **Run** the installer (Windows: `.exe`, macOS: `.dmg`, Linux: `.AppImage`)
3. **Launch** the Timetable Generator application

### First Time Setup

#### Step 1: Configure Global Settings (2 minutes)
1. Click on **"Global Settings"** in the sidebar
2. Set **Number of Day Orders**: `5` (example)
3. Set **Hours Per Day**: `6` (example)
4. Set **Break Hours**: `3,4` (example - hours 3 and 4 are breaks)
5. Click **"Save Settings"**

#### Step 2: Add Classes (1 minute)
1. Click on **"Classes"** in the sidebar
2. Add your classes:
   - First Year
   - Second Year
   - Third Year
3. Click **"Add Class"** for each

#### Step 3: Add Subjects (5 minutes)
1. Click on **"Subjects"** in the sidebar
2. For each class, add subjects with:
   - Subject name
   - Class selection
   - Weekly hours needed
   - Priority level:
     - **HIGH**: Core subjects, labs
     - **MEDIUM**: Regular subjects
     - **LOW**: Electives, optional

Example for First Year:
- Mathematics (5 hrs/week, HIGH)
- Physics (4 hrs/week, HIGH)
- Chemistry (4 hrs/week, HIGH)
- English (3 hrs/week, MEDIUM)
- Physical Education (2 hrs/week, LOW)

#### Step 4: Add Teachers (5 minutes)
1. Click on **"Teachers"** in the sidebar
2. Add teachers with:
   - Teacher name
   - Maximum hours per day (hard limit)
   - Preferred days (optional)
   - Preferred time slots (optional)

Example:
- Dr. Smith (5 hrs/day, prefers Days 1,2,3, Morning)
- Prof. Johnson (4 hrs/day, prefers Days 2,4, Afternoon)
- Dr. Williams (6 hrs/day, no preferences)

#### Step 5: Allocate Teachers to Subjects (3 minutes)
1. Click on **"Allocations"** in the sidebar
2. For each subject, assign a teacher
3. Note: One teacher can teach multiple subjects

#### Step 6: Generate Timetable (Instant!)
1. Click on **"Timetable"** in the sidebar
2. Click **"Generate Timetable"**
3. Confirm the action
4. Wait for completion (usually < 5 seconds)
5. View the generated timetable!

#### Step 7: Review and Export
1. Switch between classes to view their timetables
2. Check **"Teacher Workload"** to see distribution
3. Export to PDF or Excel using the **"Export"** button

### Tips for Best Results

✅ **DO:**
- Start with HIGH priority subjects
- Set realistic teacher daily limits (4-6 hours)
- Use break hours appropriately
- Balance workload across teachers
- Test with small dataset first

❌ **DON'T:**
- Over-constrain teachers (too many preferences)
- Set impossible requirements (too many subjects, too few slots)
- Assign too many hours to one teacher
- Forget to save after configuration changes

---

## For Developers

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Git

### Clone and Setup

```bash
# Clone repository
git clone https://github.com/codewith-lionel/TIME-TABLE-GENERATOR.git
cd TIME-TABLE-GENERATOR

# Install dependencies
npm install

# Build React application
npx webpack --mode production

# Run in development mode (with DevTools)
npm run dev

# Or run in production mode
npm start
```

### Development Workflow

#### 1. Make Changes to React Components
```bash
# Edit files in src/components/

# Rebuild
npx webpack --mode development

# Run
npm run dev
```

#### 2. Make Changes to Backend Logic
```bash
# Edit files in:
# - main.js (IPC handlers)
# - database/DatabaseService.js (database)
# - core/TimetableGenerator.js (algorithm)

# Run
npm run dev
```

#### 3. Hot Reload Development
```bash
# Terminal 1: Watch and rebuild React
npx webpack --watch

# Terminal 2: Run Electron
npm run dev
```

### Project Structure

```
src/
├── components/          # React UI components
│   ├── App.jsx         # Main app container
│   ├── GlobalSettings.jsx
│   ├── ClassManagement.jsx
│   ├── SubjectManagement.jsx
│   ├── TeacherManagement.jsx
│   ├── AllocationManagement.jsx
│   ├── TimetableView.jsx
│   └── TeacherWorkload.jsx
└── styles/
    └── main.css        # Application styles

database/
└── DatabaseService.js  # SQLite operations

core/
└── TimetableGenerator.js  # Scheduling algorithm

services/
└── ExportService.js    # PDF/Excel export

main.js                 # Electron main process
preload.js             # IPC bridge
```

### Common Development Tasks

#### Add a New IPC Method

**1. Update preload.js:**
```javascript
contextBridge.exposeInMainWorld('api', {
  // ... existing methods
  myNewMethod: (params) => ipcRenderer.invoke('my-new-method', params)
});
```

**2. Update main.js:**
```javascript
ipcMain.handle('my-new-method', async (event, params) => {
  try {
    // Your logic here
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

**3. Use in React:**
```javascript
const handleAction = async () => {
  const result = await window.api.myNewMethod(params);
  if (result.success) {
    // Handle success
  } else {
    alert('Error: ' + result.error);
  }
};
```

#### Modify the Algorithm

Edit `core/TimetableGenerator.js`:

```javascript
// Change scoring weights
calculateSlotScore(allocation, teacher, day, hour) {
  let score = 0;
  
  // Adjust these values
  if (teacherPreferredDay) score += 50;  // Change this
  if (morningPreference) score += 30;    // Change this
  // ... etc
  
  return score;
}
```

#### Customize UI Colors

Edit `src/styles/main.css`:

```css
/* Change primary color */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change to your colors ^ */
}

/* Change sidebar active color */
.nav-button.active {
  background: linear-gradient(135deg, #your-color 0%, #your-color2 100%);
}
```

#### Add New Database Table

Edit `database/DatabaseService.js`:

```javascript
createTables() {
  // ... existing tables
  
  this.db.exec(`
    CREATE TABLE IF NOT EXISTS my_new_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
```

### Testing

#### Manual Testing
```bash
# Run application
npm run dev

# Follow test cases in TESTING_GUIDE.md
```

#### Test Database Location
- Windows: `%APPDATA%/timetable-generator/timetable.db`
- macOS: `~/Library/Application Support/timetable-generator/timetable.db`
- Linux: `~/.config/timetable-generator/timetable.db`

#### Clear Database for Fresh Start
```bash
# Linux/macOS
rm -rf ~/.config/timetable-generator/

# Windows (PowerShell)
Remove-Item -Recurse -Force $env:APPDATA\timetable-generator\
```

### Building for Distribution

#### Windows Executable
```bash
npm run build:win
# Output: dist/Timetable Generator Setup.exe
```

#### Configure Build
Edit `package.json`:
```json
"build": {
  "appId": "com.yourcompany.timetable",
  "productName": "Your Timetable Generator",
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  }
}
```

### Debugging

#### Enable Developer Tools
Already enabled in dev mode with `npm run dev`

#### View Console Logs
- Main process logs: Terminal output
- Renderer process logs: DevTools Console (F12)

#### Debug Algorithm
Add console.logs in `TimetableGenerator.js`:
```javascript
findBestSlot(allocation) {
  console.log('Finding slot for:', allocation.subject_name);
  // ... algorithm
  console.log('Best slot found:', bestSlot, 'Score:', bestScore);
}
```

### Common Issues

#### Issue: Webpack build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npx webpack
```

#### Issue: Electron won't start
```bash
# Check if renderer/bundle.js exists
ls renderer/bundle.js

# If not, rebuild
npx webpack

# Then start
npm start
```

#### Issue: Database errors
```bash
# Delete database and restart
# (Location depends on OS - see above)
```

### Performance Optimization

#### Large Datasets
For 50+ classes or 500+ subjects:

1. **Increase algorithm timeout:**
   ```javascript
   // In TimetableGenerator.js
   // Add time limit check in scheduling loop
   ```

2. **Use database indexes:**
   ```javascript
   // In DatabaseService.js
   this.db.exec(`CREATE INDEX idx_class_id ON subjects(class_id)`);
   ```

3. **Implement pagination:**
   ```jsx
   // In React components for large lists
   ```

### Documentation

- **README.md** - User guide and overview
- **ALGORITHM.md** - Detailed algorithm explanation
- **TESTING_GUIDE.md** - Test procedures and cases
- **ARCHITECTURE.md** - System architecture
- **This file** - Quick start guide

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/codewith-lionel/TIME-TABLE-GENERATOR/issues

---

## Quick Reference

### NPM Scripts
```bash
npm start          # Run in production mode
npm run dev        # Run in development mode (with DevTools)
npm run build:win  # Build Windows executable
```

### Key Files
- `main.js` - Electron main process
- `preload.js` - IPC bridge
- `core/TimetableGenerator.js` - Core algorithm
- `database/DatabaseService.js` - Database operations
- `src/components/App.jsx` - Main React component

### Algorithm Scoring
- Teacher day preference: +50
- Teacher time preference: +30-40
- HIGH priority morning: +20
- Distribution bonus: +10
- Consecutive penalty: -10

### Hard Constraints
1. No teacher clashes
2. Teacher daily limits
3. Subject coverage
4. Class slot uniqueness

### Soft Constraints
1. Teacher preferences
2. Subject priorities
3. Distribution rules

---

**Ready to start?** Jump to the section that matches your role:
- **End User**: Follow "First Time Setup" above
- **Developer**: Follow "Clone and Setup" above

Happy scheduling! 📅✨
