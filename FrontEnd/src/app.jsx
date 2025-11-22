import React, { useState, useEffect } from 'react';
import { Play, Settings, Image, Download, Loader, XCircle, CheckCircle, FolderOpen } from 'lucide-react';

export default function PinterestSlideshowApp() {
  const [boardUrl, setBoardUrl] = useState('');
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

  // Check Python setup on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.checkPythonSetup().then(setSetupCheck);
    }
  }, []);

  // Setup progress and status listeners
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onProgress((newProgress) => {
      setProgress(newProgress);
    });

    window.electronAPI.onStatus((newStatus) => {
      setStatus(newStatus);
    });

    // Cleanup listeners on unmount
    return () => {
      window.electronAPI.removeProgressListener();
      window.electronAPI.removeStatusListener();
    };
  }, []);

  const handleGenerate = async () => {
    if (!boardUrl.trim()) {
      setError('Please enter a Pinterest board URL');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting...');
    setError('');
    setVideoPath('');

    try {
      const result = await window.electronAPI.generateSlideshow({
        boardUrl,
        duration,
        recencyWeight,
        numImages: numImages === 'auto' ? null : parseInt(numImages),
      });

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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #fee2e2, #fce7f3, #ffe4e6)', padding: '24px' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <Image style={{ width: '40px', height: '40px', color: '#dc2626' }} />
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>Pinterest Slideshow</h1>
          </div>
          <p style={{ color: '#4b5563' }}>Create beautiful video slideshows from your Pinterest boards</p>
        </div>

        {/* Setup Warning */}
        {(!setupCheck.venvExists || !setupCheck.envExists) && (
          <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '16px', marginBottom: '24px', borderRadius: '0 8px 8px 0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>Setup Required</h3>
            <ul style={{ fontSize: '14px', color: '#78350f', listStyle: 'disc', marginLeft: '20px' }}>
              {!setupCheck.venvExists && <li>Python virtual environment not found. Run: <code style={{ background: '#fde68a', padding: '2px 4px', borderRadius: '4px' }}>python -m venv backend/venv</code></li>}
              {!setupCheck.envExists && <li>.env file not found. Create one with your Pinterest API credentials</li>}
            </ul>
          </div>
        )}

        {/* Main Card */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '32px', marginBottom: '24px' }}>
          {/* Board Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Pinterest Board URL or ID
            </label>
            <input
              type="text"
              value={boardUrl}
              onChange={(e) => setBoardUrl(e.target.value)}
              placeholder="https://pinterest.com/username/board-name or board-id"
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
              disabled={isGenerating}
            />
          </div>

          {/* Quick Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                min="10"
                max="300"
                disabled={isGenerating}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Number of Images
              </label>
              <input
                type="text"
                value={numImages}
                onChange={(e) => setNumImages(e.target.value)}
                style={{ width: '100%', padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                placeholder="auto"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}
            disabled={isGenerating}
          >
            <Settings style={{ width: '16px', height: '16px' }} />
            {showSettings ? 'Hide' : 'Show'} Advanced Settings
          </button>

          {/* Advanced Settings */}
          {showSettings && (
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Recency Weight: {recencyWeight.toFixed(2)}
              </label>
              <input
                type="range"
                value={recencyWeight}
                onChange={(e) => setRecencyWeight(Number(e.target.value))}
                style={{ width: '100%' }}
                min="0"
                max="1"
                step="0.1"
                disabled={isGenerating}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Higher values favor more recent pins
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', display: 'flex', alignItems: 'start', gap: '12px' }}>
              <XCircle style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>{error}</div>
            </div>
          )}

          {/* Progress Bar */}
          {isGenerating && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{status}</span>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>{progress}%</span>
              </div>
              <div style={{ width: '100%', background: '#e5e7eb', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
                <div
                  style={{ background: 'linear-gradient(to right, #ef4444, #ec4899)', height: '100%', transition: 'width 0.5s ease-out', width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {videoPath && !isGenerating && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#15803d', fontWeight: '500' }}>{status}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={handleOpenVideo}
                      style={{ padding: '8px 16px', background: '#16a34a', color: 'white', fontSize: '14px', fontWeight: '500', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FolderOpen style={{ width: '16px', height: '16px' }} />
                      Open Video
                    </button>
                    <button
                      onClick={handleSaveAs}
                      style={{ padding: '8px 16px', background: 'white', color: '#15803d', fontSize: '14px', fontWeight: '500', borderRadius: '8px', border: '1px solid #86efac', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Download style={{ width: '16px', height: '16px' }} />
                      Save As...
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate/Cancel Button */}
          {isGenerating ? (
            <button
              onClick={handleCancel}
              style={{ width: '100%', background: '#4b5563', color: 'white', fontWeight: '600', padding: '16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            >
              <XCircle style={{ width: '20px', height: '20px' }} />
              Cancel
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!setupCheck.venvExists || !setupCheck.envExists}
              style={{ width: '100%', background: (!setupCheck.venvExists || !setupCheck.envExists) ? '#9ca3af' : 'linear-gradient(to right, #dc2626, #db2777)', color: 'white', fontWeight: '600', padding: '16px', borderRadius: '8px', border: 'none', cursor: (!setupCheck.venvExists || !setupCheck.envExists) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            >
              <Play style={{ width: '20px', height: '20px' }} />
              Generate Slideshow
            </button>
          )}
        </div>

        {/* Info Card */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '24px', borderLeft: '4px solid #ef4444' }}>
          <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>📌 How to use:</h3>
          <ol style={{ fontSize: '14px', color: '#4b5563', listStyle: 'decimal', marginLeft: '20px' }}>
            <li>Set up your Python virtual environment</li>
            <li>Install dependencies in backend folder</li>
            <li>Create a .env file with your Pinterest API credentials</li>
            <li>Paste your Pinterest board URL or ID above</li>
            <li>Adjust duration and settings as needed</li>
            <li>Click "Generate Slideshow" and wait for your video!</li>
          </ol>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '16px', fontStyle: 'italic' }}>
            Note: You're responsible for complying with Pinterest's Terms of Service. Use only boards you have access to.
          </p>
        </div>
      </div>
    </div>
  );
}