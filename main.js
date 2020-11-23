const { app, BrowserWindow } = require('electron')
const ejs = require('ejs-electron')
const reload = require('electron-reload')
const path = require('path')

function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // and load the index.html of the app.
      win.loadFile('index.html').then(function(){
        win.removeMenu();
        win.maximize();
        // win.darkTheme(true);
        win.show();
        // win.webContents.openDevTools();
      });

   
}

reload(__dirname, {
    electron: path.join(__dirname, 'node_modules/.bin/electron.cmd')
});




app.whenReady().then(createWindow)


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.allowRendererProcessReuse = false;


