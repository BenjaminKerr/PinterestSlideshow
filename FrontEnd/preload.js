const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Generate slideshow
  generateSlideshow: (options) => 
    ipcRenderer.invoke('generate-slideshow', options),
  
  // Cancel generation
  cancelGeneration: () => 
    ipcRenderer.invoke('cancel-generation'),
  
  // Progress updates
  onProgress: (callback) => {
    ipcRenderer.on('slideshow-progress', (event, progress) => callback(progress));
  },
  
  // Status updates
  onStatus: (callback) => {
    ipcRenderer.on('slideshow-status', (event, status) => callback(status));
  },
  
  // Remove listeners (cleanup)
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('slideshow-progress');
  },
  
  removeStatusListener: () => {
    ipcRenderer.removeAllListeners('slideshow-status');
  },
  
  // Save dialog
  saveVideoDialog: () => 
    ipcRenderer.invoke('save-video-dialog'),
  
  // Open video
  openVideo: (videoPath) => 
    ipcRenderer.invoke('open-video', videoPath),
  
  // Check setup
  checkPythonSetup: () => 
    ipcRenderer.invoke('check-python-setup'),
});
