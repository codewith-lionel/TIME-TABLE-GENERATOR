const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DatabaseService = require('./database/DatabaseService');
const TimetableGenerator = require('./core/TimetableGenerator');

let mainWindow;
let dbService;
let timetableGenerator;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('renderer/index.html');
  
  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database
  dbService = new DatabaseService();
  dbService.initialize();
  
  // Initialize timetable generator
  timetableGenerator = new TimetableGenerator(dbService);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Global Settings
ipcMain.handle('save-global-settings', async (event, settings) => {
  try {
    dbService.saveGlobalSettings(settings);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-global-settings', async () => {
  try {
    return { success: true, data: dbService.getGlobalSettings() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Classes
ipcMain.handle('save-class', async (event, classData) => {
  try {
    const id = dbService.saveClass(classData);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-classes', async () => {
  try {
    return { success: true, data: dbService.getClasses() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-class', async (event, id) => {
  try {
    dbService.deleteClass(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Subjects
ipcMain.handle('save-subject', async (event, subjectData) => {
  try {
    const id = dbService.saveSubject(subjectData);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-subjects', async (event, classId) => {
  try {
    return { success: true, data: dbService.getSubjects(classId) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-subject', async (event, id) => {
  try {
    dbService.deleteSubject(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Teachers
ipcMain.handle('save-teacher', async (event, teacherData) => {
  try {
    const id = dbService.saveTeacher(teacherData);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-teachers', async () => {
  try {
    return { success: true, data: dbService.getTeachers() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-teacher', async (event, id) => {
  try {
    dbService.deleteTeacher(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Subject-Teacher Allocation
ipcMain.handle('save-allocation', async (event, allocationData) => {
  try {
    const id = dbService.saveAllocation(allocationData);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-allocations', async () => {
  try {
    return { success: true, data: dbService.getAllocations() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-allocation', async (event, id) => {
  try {
    dbService.deleteAllocation(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Timetable Generation
ipcMain.handle('generate-timetable', async () => {
  try {
    const result = timetableGenerator.generate();
    if (result.success) {
      dbService.saveTimetable(result.timetable);
      return { success: true, data: result.timetable, stats: result.stats };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-timetable', async () => {
  try {
    return { success: true, data: dbService.getTimetable() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-timetable-slot', async (event, slotData) => {
  try {
    const validation = timetableGenerator.validateSlotChange(slotData);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }
    dbService.updateTimetableSlot(slotData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-teacher-workload', async () => {
  try {
    return { success: true, data: timetableGenerator.getTeacherWorkload() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export
ipcMain.handle('export-timetable', async (event, options) => {
  try {
    const ExportService = require('./services/ExportService');
    const exportService = new ExportService(dbService);
    const filePath = await exportService.export(options);
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
