# Timetable Generator - Testing & Usage Guide

## Quick Start

### Installation & Build

```bash
# 1. Install dependencies
npm install

# 2. Build React application
npx webpack --mode production

# 3. Start the application
npm start
```

For development with DevTools:
```bash
npm run dev
```

## Step-by-Step Testing Guide

### Test Case 1: Basic Configuration

**Objective**: Configure the system with basic settings

**Steps**:
1. Launch the application
2. Navigate to "Global Settings" tab
3. Set Number of Day Orders: 5
4. Set Hours Per Day: 6
5. Set Break Hours: 3,4
6. Click "Save Settings"

**Expected Result**: 
- Success message appears
- Settings saved to database

---

### Test Case 2: Add Classes

**Objective**: Create multiple classes for scheduling

**Steps**:
1. Navigate to "Classes" tab
2. Add "First Year"
3. Add "Second Year"
4. Add "Third Year"

**Expected Result**:
- All three classes appear in the list
- Each class has a unique ID

---

### Test Case 3: Add Subjects

**Objective**: Add subjects with different priorities

**Steps**:
1. Navigate to "Subjects" tab
2. Add subjects for First Year:
   - Mathematics (5 hours/week, HIGH priority)
   - Physics (4 hours/week, HIGH priority)
   - English (3 hours/week, MEDIUM priority)
   - Physical Education (2 hours/week, LOW priority)
3. Add subjects for Second Year:
   - Data Structures (5 hours/week, HIGH priority)
   - Algorithms (4 hours/week, HIGH priority)
   - Operating Systems (3 hours/week, MEDIUM priority)
4. Add subjects for Third Year:
   - Machine Learning (5 hours/week, HIGH priority)
   - Cloud Computing (4 hours/week, HIGH priority)
   - Soft Skills (2 hours/week, LOW priority)

**Expected Result**:
- All subjects appear in table
- Grouped by class
- Priority badges displayed correctly

---

### Test Case 4: Add Teachers

**Objective**: Create teachers with preferences and constraints

**Steps**:
1. Navigate to "Teachers" tab
2. Add Teacher 1:
   - Name: Dr. Smith
   - Max Hours/Day: 5
   - Preferred Days: 1, 2, 3
   - Time Slots: Morning
3. Add Teacher 2:
   - Name: Prof. Johnson
   - Max Hours/Day: 4
   - Preferred Days: 2, 4
   - Time Slots: Afternoon
4. Add Teacher 3:
   - Name: Dr. Williams
   - Max Hours/Day: 6
   - Preferred Days: 1, 3, 5
   - Time Slots: Morning
5. Add Teacher 4:
   - Name: Prof. Brown
   - Max Hours/Day: 5
   - No preferences
6. Add Teacher 5:
   - Name: Dr. Davis
   - Max Hours/Day: 4
   - Preferred Days: 3, 4, 5
   - Time Slots: Morning & Afternoon

**Expected Result**:
- All 5 teachers in list
- Preferences displayed correctly

---

### Test Case 5: Subject-Teacher Allocation

**Objective**: Allocate teachers to subjects

**Steps**:
1. Navigate to "Allocations" tab
2. Create allocations:
   - Mathematics → Dr. Smith
   - Physics → Prof. Johnson
   - English → Dr. Williams
   - Physical Education → Prof. Brown
   - Data Structures → Dr. Smith
   - Algorithms → Dr. Williams
   - Operating Systems → Prof. Johnson
   - Machine Learning → Dr. Davis
   - Cloud Computing → Dr. Williams
   - Soft Skills → Prof. Brown

**Expected Result**:
- All allocations created
- Grouped by class in display
- No duplicate subject allocations

---

### Test Case 6: Generate Timetable

**Objective**: Generate complete timetable for all classes

**Steps**:
1. Navigate to "Timetable" tab
2. Click "Generate Timetable"
3. Confirm generation
4. Wait for completion

**Expected Result**:
- Success message appears
- Statistics displayed:
  - Total Slots
  - Filled Slots
  - Utilization Rate
  - Preference Match Rate
- Timetable grid populated with subjects and teachers

**Validation Checks**:
- [ ] No teacher appears in two classes at same time
- [ ] No teacher exceeds max daily hours
- [ ] All subjects scheduled for correct weekly hours
- [ ] HIGH priority subjects appear in morning slots
- [ ] Teacher preferences reflected when possible

---

### Test Case 7: Teacher Clash Validation

**Objective**: Verify no teacher clashes exist

**Steps**:
1. In Timetable view, check each time slot
2. For each day and hour, verify:
   - If teacher appears, they appear only once
3. Navigate to "Teacher Workload" tab
4. Check daily hours distribution

**Expected Result**:
- No teacher scheduled in multiple classes simultaneously
- Daily hour limits respected
- Visual bars show correct distribution

---

### Test Case 8: Manual Editing

**Objective**: Test manual timetable editing with validation

**Steps**:
1. In Timetable tab, click "Enable Editing"
2. Click on a filled cell
3. Try changing to different subject-teacher combination
4. Try changing to create a teacher clash
5. Try changing to exceed teacher's daily limit

**Expected Result**:
- Valid changes: Applied successfully
- Teacher clash: Error message shown
- Daily limit exceeded: Error message shown
- Cell colors update correctly

---

### Test Case 9: Export Functionality

**Objective**: Export timetables in different formats

**Steps**:
1. Navigate to "Timetable" tab
2. Click "Export" dropdown
3. Export options:
   - PDF - Current Class
   - PDF - All Classes
   - Excel - Current Class
   - Excel - All Classes
4. Navigate to "Teacher Workload" tab
5. Export workload:
   - PDF
   - Excel

**Expected Result**:
- Files created in Downloads folder
- PDFs contain proper formatting
- Excel files contain data in grid format
- All data accurate and readable

---

### Test Case 10: Teacher Workload Analysis

**Objective**: Analyze teacher workload distribution

**Steps**:
1. Navigate to "Teacher Workload" tab
2. Review each teacher card:
   - Weekly hours
   - Daily hours distribution
   - Subjects assigned
   - Load status (High/Medium/Low)

**Expected Result**:
- All teachers displayed
- Bar charts show correct hours
- Colors indicate load level correctly
- Summary statistics accurate

---

## Edge Cases & Stress Tests

### Edge Case 1: Over-Constrained System

**Setup**: 
- 3 classes
- 10 subjects per class (30 total)
- Only 2 teachers
- Teachers have max 4 hours/day

**Expected**: Generation fails with clear error message

---

### Edge Case 2: Teacher Preferences Impossible

**Setup**:
- Teacher prefers only Day 1
- Assigned 10 subjects requiring more slots than available

**Expected**: System places outside preference with lower score

---

### Edge Case 3: All HIGH Priority

**Setup**: Mark all subjects as HIGH priority

**Expected**: Algorithm schedules by weekly hours (descending)

---

### Edge Case 4: Empty Class

**Setup**: Create class with no subjects

**Expected**: Timetable generation succeeds, class has empty slots

---

## Performance Benchmarks

### Small Scale
- 3 classes
- 15 subjects
- 5 teachers
- **Expected Time**: < 1 second

### Medium Scale
- 5 classes
- 30 subjects
- 10 teachers
- **Expected Time**: < 3 seconds

### Large Scale
- 10 classes
- 60 subjects
- 20 teachers
- **Expected Time**: < 10 seconds

---

## Common Issues & Solutions

### Issue 1: "Cannot schedule subject"

**Cause**: Over-constrained system (too many subjects, too few teachers/slots)

**Solution**: 
- Add more teachers
- Reduce weekly hours for some subjects
- Increase teacher daily limits
- Add more day orders or hours per day

---

### Issue 2: Low preference match rate

**Cause**: Teacher preferences too restrictive

**Solution**:
- Relax teacher preferences
- Ensure preferences don't conflict with workload
- Distribute workload more evenly

---

### Issue 3: Export fails

**Cause**: No timetable generated yet

**Solution**: Generate timetable first before exporting

---

### Issue 4: Edit validation errors

**Cause**: Attempting invalid slot change

**Solution**: Review error message and:
- Choose different time slot
- Assign different teacher
- Clear conflicting slot first

---

## Database Location

The SQLite database is stored at:
- **Windows**: `C:\Users\<username>\AppData\Roaming\timetable-generator\timetable.db`
- **macOS**: `~/Library/Application Support/timetable-generator/timetable.db`
- **Linux**: `~/.config/timetable-generator/timetable.db`

---

## Building for Production

### Windows Executable

```bash
npm run build:win
```

Output: `dist/Timetable Generator Setup.exe`

### Configuration

Edit `package.json` build section for custom icons, names, or settings.

---

## Algorithm Parameters

You can fine-tune the scoring system in `core/TimetableGenerator.js`:

```javascript
// Line ~245: Preference scoring
teacherDayPreference: 50 points
teacherTimeSlotPreference: 30-40 points
priorityMorningBonus: 20 points
distributionBonus: 10 points
consecutivePenalty: -10 points
```

Adjust these values to change algorithm behavior.

---

## Support & Development

For issues or feature requests, please visit:
https://github.com/codewith-lionel/TIME-TABLE-GENERATOR

---

## Security Notes

1. **Data Privacy**: All data stored locally, no cloud sync
2. **IPC Security**: Context isolation enabled
3. **No External APIs**: Fully offline application
4. **Database**: SQLite with proper constraints

---

## Next Steps After Testing

Once testing is complete:
1. Customize UI colors/themes in `src/styles/main.css`
2. Adjust algorithm weights in `core/TimetableGenerator.js`
3. Add institutional logo to UI
4. Build production executable
5. Deploy to target machines
