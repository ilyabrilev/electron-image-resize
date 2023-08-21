const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1000 : 500,
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: isDev,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // open devtools if in dev env
    console.log(isDev, process.env.NODE_ENV);
    if (isDev) {
        console.log('opening dev tools')
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

function createAboutWindow() {
    const aboutWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: 300,
        height: 300,
    });

    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
};

//Menu template
const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {
                label: 'About',
                click: createAboutWindow,
            }
        ],
    }] : []),
    {
        // role: 'fileMenu',
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                click: () => app.quit(),
                accelerator: 'CmdOrCtrl+W'
            }
        ]
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: createAboutWindow,
            }
        ]
    }] : []),
];

// app is ready
app.whenReady().then(() => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    //remove mainWindow from memory on close
    mainWindow.on('closed', () => (mainWindow = null))

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    })
});

//respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), path.sep, 'Projects', path.sep, 'temp', path.sep, 'imageresizer');
    resizeImage(options);
})

async function resizeImage({imgPath, width, height, dest}) {
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        });

        //create filename
        const filename = path.basename(imgPath);

        //create dest folder if not exists
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, {recursive: true});
        }

        //write file to destination
        fs.writeFileSync(path.join(dest, filename), newPath);

        //send success to render
        mainWindow.webContents.send('image:done');

        //open dest folder
        shell.openPath(dest);

    } catch (error) {
        console.log(error);
    }
}

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});
 