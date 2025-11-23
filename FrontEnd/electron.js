const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icon.png'),
  });

  // Load React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (pythonProcess) {
      pythonProcess.kill();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handler: Generate slideshow
ipcMain.handle('generate-slideshow', async (event, options) => {
  const { boardUrl, duration, recencyWeight, numImages } = options;

  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../backend/slideshow.py');
    
    const venvPath = path.join(__dirname, '../backend/venv');
    let pythonExecutable;
    
    if (fs.existsSync(venvPath)) {
      pythonExecutable = process.platform === 'win32'
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
    } else {
      pythonExecutable = 'python3';
    }

    const args = [
      pythonScript,
      '--board-url', boardUrl,
      '--duration', duration.toString(),
      '--recency-weight', recencyWeight.toString(),
    ];

    if (numImages !== 'auto') {
      args.push('--num-images', numImages.toString());
    }

    pythonProcess = spawn(pythonExecutable, args);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString();
      outputData += message;
      
      const lines = message.split('\n');
      lines.forEach(line => {
        if (line.startsWith('PROGRESS:')) {
          const progress = parseInt(line.split(':')[1]);
          event.sender.send('slideshow-progress', progress);
        } else if (line.startsWith('STATUS:')) {
          const status = line.substring(7).trim();
          event.sender.send('slideshow-status', status);
        }
      });
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('Python Error:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      pythonProcess = null;
      
      if (code === 0) {
        const lines = outputData.split('\n');
        const videoPathLine = lines.find(line => line.startsWith('OUTPUT:'));
        const videoPath = videoPathLine 
          ? videoPathLine.substring(7).trim()
          : path.join(__dirname, '../output/slideshow.mp4');
        
        resolve({
          success: true,
          videoPath: videoPath,
          message: 'Slideshow generated successfully!',
        });
      } else {
        reject({
          success: false,
          error: errorData || 'Python process failed',
          code: code,
        });
      }
    });

    pythonProcess.on('error', (error) => {
      pythonProcess = null;
      reject({
        success: false,
        error: `Failed to start Python process: ${error.message}`,
      });
    });
  });
});

// IPC Handler: Cancel generation
ipcMain.handle('cancel-generation', async () => {
  if (pythonProcess) {
    pythonProcess.kill('SIGTERM');
    pythonProcess = null;
    return { success: true };
  }
  return { success: false, message: 'No process running' };
});

// IPC Handler: Open save dialog
ipcMain.handle('save-video-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Slideshow Video',
    defaultPath: 'pinterest-slideshow.mp4',
    filters: [
      { name: 'Videos', extensions: ['mp4'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  return result;
});

// IPC Handler: Open video file
ipcMain.handle('open-video', async (event, videoPath) => {
  const { shell } = require('electron');
  
  // Convert to absolute path if relative
  const absolutePath = path.isAbsolute(videoPath) 
    ? videoPath 
    : path.join(__dirname, '..', videoPath);
  
  console.log('Opening video at:', absolutePath);
  await shell.openPath(absolutePath);
});

// IPC Handler: Check Python setup
ipcMain.handle('check-python-setup', async () => {
  const venvPath = path.join(__dirname, '../backend/venv');
  const envPath = path.join(__dirname, '../.env');
  
  return {
    venvExists: fs.existsSync(venvPath),
    envExists: fs.existsSync(envPath),
  };
});

// IPC Handler: Select folder
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }
  return { success: false };
});

// IPC Handler: Generate slideshow from local folder
ipcMain.handle('generate-slideshow-local', async (event, options) => {
  const { folderPath, duration, numImages } = options;

  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../backend/local_slideshow.py');
    const outputPath = path.join(__dirname, '../output/slideshow.mp4');
    
    const venvPath = path.join(__dirname, '../backend/venv');
    let pythonExecutable;
    
    if (fs.existsSync(venvPath)) {
      pythonExecutable = process.platform === 'win32'
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
    } else {
      pythonExecutable = 'python3';
    }

    const args = [
        pythonScript,
        '--input-folder', folderPath,
        '--duration', duration.toString(),
        '--output', outputPath,  // Add this line
    ];

    if (numImages && numImages !== 'auto') {
      args.push('--num-images', numImages.toString());
    }

    pythonProcess = spawn(pythonExecutable, args);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString();
      outputData += message;
      
      const lines = message.split('\n');
      lines.forEach(line => {
        if (line.startsWith('PROGRESS:')) {
          const progress = parseInt(line.split(':')[1]);
          event.sender.send('slideshow-progress', progress);
        } else if (line.startsWith('STATUS:')) {
          const status = line.substring(7).trim();
          event.sender.send('slideshow-status', status);
        }
      });
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('Python Error:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      pythonProcess = null;
      
      if (code === 0) {
        const lines = outputData.split('\n');
        const videoPathLine = lines.find(line => line.startsWith('OUTPUT:'));
        const videoPath = videoPathLine 
            ? videoPathLine.substring(7).trim()
            : outputPath;  // Use outputPath instead of the hardcoded path
        
        resolve({
            success: true,
            videoPath: videoPath,
            message: 'Slideshow generated successfully!',
        });
      } else {
        reject({
          success: false,
          error: errorData || 'Python process failed',
          code: code,
        });
      }
    });

    pythonProcess.on('error', (error) => {
      pythonProcess = null;
      reject({
        success: false,
        error: `Failed to start Python process: ${error.message}`,
      });
    });
  });
});