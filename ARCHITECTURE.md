# System Architecture

## Application Overview

```
┌────────────────────────────────────────────────────────────────┐
│                   TIMETABLE GENERATOR                           │
│                 Electron Desktop Application                    │
└────────────────────────────────────────────────────────────────┘
```

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         RENDERER PROCESS                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     React UI Layer                              │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐    │ │
│  │  │  Global  │ Classes  │ Subjects │ Teachers │ Allocate │    │ │
│  │  │ Settings │          │          │          │          │    │ │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘    │ │
│  │  ┌──────────┬──────────────────────────────────────────┐    │ │
│  │  │Timetable │       Teacher Workload                   │    │ │
│  │  │   View   │                                           │    │ │
│  │  └──────────┴──────────────────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              ↕                                       │
│                    window.api (IPC Bridge)                           │
└──────────────────────────────────────────────────────────────────────┘
                               ↕
┌──────────────────────────────────────────────────────────────────────┐
│                          PRELOAD SCRIPT                              │
│                   (Secure Context Bridge)                            │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  contextBridge.exposeInMainWorld('api', {                   │  │
│   │    saveGlobalSettings, getGlobalSettings,                   │  │
│   │    saveClass, getClasses, deleteClass,                      │  │
│   │    saveSubject, getSubjects, deleteSubject,                 │  │
│   │    saveTeacher, getTeachers, deleteTeacher,                 │  │
│   │    saveAllocation, getAllocations, deleteAllocation,        │  │
│   │    generateTimetable, getTimetable, updateTimetableSlot,    │  │
│   │    getTeacherWorkload, exportTimetable                      │  │
│   │  })                                                         │  │
│   └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                               ↕
┌──────────────────────────────────────────────────────────────────────┐
│                           MAIN PROCESS                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   IPC Main Handlers                             │ │
│  │  • Global Settings Handlers                                    │ │
│  │  • Class Management Handlers                                   │ │
│  │  • Subject Management Handlers                                 │ │
│  │  • Teacher Management Handlers                                 │ │
│  │  • Allocation Handlers                                         │ │
│  │  • Timetable Generation Handler                                │ │
│  │  • Export Handlers                                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              ↕                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Business Logic Layer                         │ │
│  │  ┌──────────────────┐    ┌──────────────────┐                 │ │
│  │  │  TimetableGen    │    │  ExportService   │                 │ │
│  │  │  Generator       │    │                  │                 │ │
│  │  │  - Algorithm     │    │  - PDF Export    │                 │ │
│  │  │  - Validation    │    │  - Excel Export  │                 │ │
│  │  │  - Optimization  │    │                  │                 │ │
│  │  └──────────────────┘    └──────────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              ↕                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  Database Service Layer                         │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │               SQLite Database (better-sqlite3)            │ │ │
│  │  │                                                            │ │ │
│  │  │  Tables:                                                   │ │ │
│  │  │  • global_settings                                        │ │ │
│  │  │  • classes                                                │ │ │
│  │  │  • subjects                                               │ │ │
│  │  │  • teachers                                               │ │ │
│  │  │  • allocations                                            │ │ │
│  │  │  • timetable                                              │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Configuration Flow
```
User Input → React Component → IPC Call → Main Process Handler 
→ Database Service → SQLite Database → Success/Error Response
→ Main Process → IPC Response → React Component → UI Update
```

### Timetable Generation Flow
```
User Clicks Generate
    ↓
TimetableView Component
    ↓
window.api.generateTimetable()
    ↓
IPC: 'generate-timetable'
    ↓
Main Process Handler
    ↓
TimetableGenerator.generate()
    ↓
┌─────────────────────────────────────┐
│  1. Load Data                       │
│     - Settings, Classes, Subjects   │
│     - Teachers, Allocations         │
├─────────────────────────────────────┤
│  2. Initialize Structures           │
│     - Teacher Availability Matrix   │
│     - Teacher Daily Hour Counters   │
│     - Subject Remaining Hours       │
│     - Empty Timetable Grid          │
├─────────────────────────────────────┤
│  3. Sort by Priority                │
│     HIGH → MEDIUM → LOW             │
├─────────────────────────────────────┤
│  4. For Each Subject Hour:          │
│     - Find Best Slot                │
│     - Check Hard Constraints        │
│     - Calculate Preference Score    │
│     - Assign Slot                   │
│     - Update Availability           │
├─────────────────────────────────────┤
│  5. Convert to DB Format            │
├─────────────────────────────────────┤
│  6. Calculate Statistics            │
└─────────────────────────────────────┘
    ↓
DatabaseService.saveTimetable()
    ↓
SQLite Database
    ↓
Response: { success, timetable, stats }
    ↓
IPC Response
    ↓
React Component
    ↓
UI Update with Timetable Grid
```

## Component Structure

### React Component Hierarchy
```
App
├── GlobalSettings
├── ClassManagement
├── SubjectManagement
├── TeacherManagement
├── AllocationManagement
├── TimetableView
│   ├── Timetable Grid
│   ├── Edit Mode Toggle
│   └── Export Dropdown
└── TeacherWorkload
    ├── Workload Cards
    ├── Daily Hours Charts
    └── Summary Statistics
```

## Algorithm Data Structures

### Teacher Availability Matrix
```javascript
{
  teacherId1: {
    day1: { hour1: true, hour2: true, hour3: false, ... },
    day2: { hour1: true, hour2: false, hour3: true, ... },
    ...
  },
  teacherId2: { ... },
  ...
}
```

### Teacher Daily Hour Counters
```javascript
{
  teacherId1: { day1: 3, day2: 4, day3: 2, day4: 5, day5: 3 },
  teacherId2: { day1: 2, day2: 3, day3: 4, day4: 2, day5: 3 },
  ...
}
```

### Timetable Structure
```javascript
{
  classId1: {
    day1: {
      hour1: { subjectId: 1, teacherId: 1, allocationId: 1 },
      hour2: { subjectId: 2, teacherId: 2, allocationId: 2 },
      hour3: null, // break
      ...
    },
    day2: { ... },
    ...
  },
  classId2: { ... },
  ...
}
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│  1. Context Isolation: ENABLED                              │
│     - Renderer can't access Node.js directly                │
│     - Prevents code injection                               │
├─────────────────────────────────────────────────────────────┤
│  2. Node Integration: DISABLED                              │
│     - Renderer process sandboxed                            │
│     - No direct filesystem access                           │
├─────────────────────────────────────────────────────────────┤
│  3. Preload Script Bridge                                   │
│     - Whitelist API methods                                 │
│     - Controlled IPC communication                          │
├─────────────────────────────────────────────────────────────┤
│  4. Content Security Policy                                 │
│     - Restricts script sources                              │
│     - Prevents XSS attacks                                  │
├─────────────────────────────────────────────────────────────┤
│  5. Local-Only Database                                     │
│     - No network exposure                                   │
│     - User data stays on device                             │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
TIME-TABLE-GENERATOR/
│
├── main.js                    # Electron main process entry
├── preload.js                 # Secure IPC bridge
├── package.json               # Dependencies & scripts
├── webpack.config.js          # React build configuration
│
├── database/
│   └── DatabaseService.js     # SQLite wrapper & queries
│
├── core/
│   └── TimetableGenerator.js  # Core scheduling algorithm
│
├── services/
│   └── ExportService.js       # PDF & Excel export
│
├── src/                       # React source files
│   ├── index.js              # React entry point
│   ├── components/           # UI components
│   │   ├── App.jsx
│   │   ├── GlobalSettings.jsx
│   │   ├── ClassManagement.jsx
│   │   ├── SubjectManagement.jsx
│   │   ├── TeacherManagement.jsx
│   │   ├── AllocationManagement.jsx
│   │   ├── TimetableView.jsx
│   │   └── TeacherWorkload.jsx
│   └── styles/
│       └── main.css          # Application styles
│
├── renderer/                  # Compiled output
│   ├── index.html            # HTML template
│   └── bundle.js             # Webpack compiled React
│
├── assets/                    # Icons & resources
│
├── README.md                  # User documentation
├── ALGORITHM.md               # Algorithm documentation
└── TESTING_GUIDE.md           # Testing procedures
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  • React 18          - UI framework                          │
│  • JSX               - Component syntax                      │
│  • CSS3              - Styling                               │
│  • Webpack 5         - Bundler                               │
│  • Babel             - JSX transpiler                        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
│  • Node.js           - Runtime                               │
│  • Electron 28       - Desktop framework                     │
│  • better-sqlite3    - Database                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      EXPORT                                  │
│  • jsPDF             - PDF generation                        │
│  • jspdf-autotable   - PDF tables                            │
│  • xlsx              - Excel generation                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      BUILD & PACKAGE                         │
│  • electron-builder  - Executable packaging                  │
│  • webpack-cli       - Build tools                           │
└─────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

### Time Complexity
- **Small (3 classes, 15 subjects)**: < 1 second
- **Medium (5 classes, 30 subjects)**: < 3 seconds
- **Large (10 classes, 60 subjects)**: < 10 seconds

### Memory Usage
- **Base Application**: ~150 MB
- **Database**: < 1 MB (typical)
- **Peak During Generation**: ~200 MB

### Database Operations
- **Read**: O(n) where n = records
- **Write**: O(1) with indexes
- **Generation**: O(S × D × H) where:
  - S = subject-hours to schedule
  - D = day orders
  - H = hours per day

## Scalability

### Current Limits
- **Classes**: 50+ (tested)
- **Subjects**: 500+ (tested)
- **Teachers**: 100+ (tested)
- **Allocations**: 500+ (tested)

### Bottlenecks
1. **Algorithm**: Grows linearly with subjects
2. **UI Rendering**: Large timetable grids (100+ cells)
3. **Export**: Large PDFs with many pages

### Optimization Strategies
1. **Virtual Scrolling**: For large lists
2. **Lazy Loading**: Load classes on-demand
3. **Caching**: Cache generated timetables
4. **Parallel Processing**: Future enhancement

## Deployment

### Development
```bash
npm install
npx webpack
npm run dev
```

### Production Build
```bash
npm install
npx webpack --mode production
npm run build:win
```

### Distribution
- **Windows**: NSIS installer (.exe)
- **Portable**: Unpacked directory
- **Updates**: Manual download & install

## Maintenance

### Adding New Feature
1. Update data model (database/DatabaseService.js)
2. Add IPC handlers (main.js)
3. Expose API (preload.js)
4. Create React component (src/components/)
5. Integrate in App.jsx
6. Test thoroughly

### Modifying Algorithm
1. Edit core/TimetableGenerator.js
2. Adjust scoring weights
3. Test with various datasets
4. Update ALGORITHM.md

### UI Customization
1. Edit src/styles/main.css
2. Modify color variables
3. Adjust layout in components
4. Test responsiveness
