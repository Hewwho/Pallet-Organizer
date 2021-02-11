const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'home.html'));

  // Reloading
  globalShortcut.register('f5', function() {
    console.log('f5 is pressed')
    mainWindow.reload()
  })
  

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Hide menu bar
  // mainWindow.removeMenu();
  
  // Maximize screen
  mainWindow.maximize();
  mainWindow.show();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const { ipcMain } = require('electron');

let filePath = '';

ipcMain.on('filepath-request', function (event) {
  event.sender.send('filepath-reply', filePath);
});

ipcMain.handle('load-file', async (event, [loadPath]) => { 
  filePath = loadPath;
  const res = await BrowserWindow.getAllWindows()[0].loadFile(path.join(__dirname, 'index.html'));
  return res;
})