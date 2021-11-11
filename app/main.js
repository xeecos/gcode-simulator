const {app,BrowserWindow} = require("electron");
const __path = __dirname;
app.on('ready',() => {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences:{
            nodeIntegration:true,
            nodeIntegrationInWorker: true,
            contextIsolation:false
        }
    })
    // win.webContents.openDevTools();
    win.maximize();
    win.loadFile(`${__path}/../public/index.html`);
})