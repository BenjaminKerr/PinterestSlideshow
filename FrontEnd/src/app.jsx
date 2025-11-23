import React, { useState, useEffect } from 'react';
import { Play, Settings, Image, Download, Loader, XCircle, CheckCircle, FolderOpen, Folder } from 'lucide-react';

export default function PinterestSlideshowApp() {
  const [mode, setMode] = useState('local');
  const [boardUrl, setBoardUrl] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [duration, setDuration] = useState(60);
  const [recencyWeight, setRecencyWeight] = useState(0.7);
  const [numImages, setNumImages] = useState('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [videoPath, setVideoPath] = useState('');
  const [setupCheck, setSetupCheck] = useState({ venvExists: false, envExists: false });

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.checkPythonSetup().then(setSetupCheck);
    }
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onProgress((newProgress) => {
      setProgress(newProgress);
    });

    window.electronAPI.onStatus((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      window.electronAPI.removeProgressListener();
      window.electronAPI.removeStatusListener();
    };
  }, []);

const handleSelectFolder = async () => {
  console.log('Browse button clicked!');
  console.log('electronAPI available?', !!window.electronAPI);
  
  if (window.electronAPI) {
    console.log('Calling selectFolder...');
    try {
      const result = await window.electronAPI.selectFolder();
      console.log('Result:', result);
      if (result.success) {
        setFolderPath(result.path);
        setError('');
      }
    } catch (err) {
      console.error('Error selecting folder:', err);
      setError('Failed to open folder dialog');
    }
  } else {
    console.error('electronAPI not available!');
    setError('Electron API not available');
  }
};

  const handleGenerate = async () => {
    if (mode === 'pinterest' && !boardUrl.trim()) {
      setError('Please enter a Pinterest board URL');
      return;
    }
    
    if (mode === 'local' && !folderPath.trim()) {
      setError('Please select a folder with images');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting...');
    setError('');
    setVideoPath('');

    try {
      let result;
      
      if (mode === 'local') {
        result = await window.electronAPI.generateSlideshowLocal({
          folderPath,
          duration,
          numImages: numImages === 'auto' ? null : parseInt(numImages),
        });
      } else {
        result = await window.electronAPI.generateSlideshow({
          boardUrl,
          duration,
          recencyWeight,
          numImages: numImages === 'auto' ? null : parseInt(numImages),
        });
      }

      if (result.success) {
        setVideoPath(result.videoPath);
        setStatus(result.message);
        setProgress(100);
      } else {
        setError(result.error || 'Failed to generate slideshow');
        setProgress(0);
      }
    } catch (err) {
      setError(err.error || err.message || 'An unexpected error occurred');
      setProgress(0);
      setStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = async () => {
    if (window.electronAPI) {
      await window.electronAPI.cancelGeneration();
      setIsGenerating(false);
      setProgress(0);
      setStatus('Generation cancelled');
    }
  };

  const handleOpenVideo = async () => {
    if (videoPath && window.electronAPI) {
      await window.electronAPI.openVideo(videoPath);
    }
  };

  const handleSaveAs = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveVideoDialog();
      if (!result.canceled) {
        setStatus(`Video saved to: ${result.filePath}`);
      }
    }
  };

  const canGenerate = mode === 'local' || (setupCheck.venvExists && setupCheck.envExists);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #fee2e2, #fce7f3, #ffe4e6)', padding: '24px' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <Image style={{ width: '40px', height: '40px', color: '#dc2626' }} />
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>Pinterest Slideshow</h1>
          </div>
          <p style={{ color: '#4b5563' }}>Create beautiful video slideshows from your Pinterest boards or local images</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'white', padding: '4px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <button onClick={() => setMode('local')} style={{ flex: 1, padding: '12px', background: mode === 'local' ? 'linear-gradient(to right, #dc2626, #db2777)' : 'transparent', color: mode === 'local' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Folder style={{ width: '20px', height: '20px' }} />
            Local Folder
          </button>
          <button onClick={() => setMode('pinterest')} style={{ flex: 1, padding: '12px', background: mode === 'pinterest' ? 'linear-gradient(to right, #dc2626, #db2777)' : 'transparent', color: mode === 'pinterest' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Image style={{ width: '20px', height: '20px' }} />
            Pinterest API
          </button>
        </div>

        {mode === 'pinterest' && (!setupCheck.venvExists || !setupCheck.envExists) && (
          <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '16px', marginBottom: '24px', borderRadius: '0 8px 8px 0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>Setup Required</h3>
            <ul style={{ fontSize: '14px', color: '#78350f', listStyle: 'disc', marginLeft: '20px' }}>
              {!setupCheck.venvExists && <li>Python virtual environment not found</li>}
              {!setupCheck.envExists && <li>.env file not found</li>}
            </ul>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '32px', marginBottom: '24px' }}>
          
          {mode === 'local' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Select Image Folder
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" value={folderPath} readOnly placeholder="No folder selected" style={{ flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb' }} />
                <button onClick={handleSelectFolder} disabled={isGenerating} style={{ padding: '12px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen style={{ width: '20px', height: '20px' }} />
                  Browse
                </button>
              </div>
            </div>
          )}

          {mode === 'pinterest' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Pinterest Board URL or ID
              </label>
              <input type="text" value={boardUrl} onChange={(e) => setBoardUrl(e.target.value)} placeholder="https://pinterest.com/username/board-name" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px' }} disabled={isGenerating} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Duration (seconds)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ width: '100%', padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px' }} min="10" max="300" disabled={isGenerating} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Number of Images</label>
              <input type="text" value={numImages} onChange={(e) => setNumImages(e.target.value)} placeholder="auto" style={{ width: '100%', padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px' }} disabled={isGenerating} />
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', display: 'flex', gap: '12px' }}>
              <XCircle style={{ width: '20px', height: '20px' }} />
              <div>{error}</div>
            </div>
          )}

          {isGenerating && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{status}</span>
                <span style={{ fontSize: '14px' }}>{progress}%</span>
              </div>
              <div style={{ width: '100%', background: '#e5e7eb', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(to right, #ef4444, #ec4899)', height: '100%', width: `${progress}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
          )}

          {videoPath && !isGenerating && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#15803d', fontWeight: '500' }}>{status}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={handleOpenVideo} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', gap: '8px' }}>
                      <FolderOpen style={{ width: '16px', height: '16px' }} />
                      Open Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isGenerating ? (
            <button onClick={handleCancel} style={{ width: '100%', background: '#4b5563', color: 'white', fontWeight: '600', padding: '16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <XCircle style={{ width: '20px', height: '20px' }} />
              Cancel
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={!canGenerate} style={{ width: '100%', background: canGenerate ? 'linear-gradient(to right, #dc2626, #db2777)' : '#9ca3af', color: 'white', fontWeight: '600', padding: '16px', borderRadius: '8px', border: 'none', cursor: canGenerate ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Play style={{ width: '20px', height: '20px' }} />
              Generate Slideshow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}