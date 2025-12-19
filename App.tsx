
import React, { useState, useEffect, useRef } from 'react';
import { VideoMetadata, Format, AppStatus, DownloadState } from './types';
import { YOUTUBE_REGEX, Icons } from './constants';
import { fetchVideoMetadata, simulateDownload } from './services/mockApi';
import VideoCard from './components/VideoCard';
import FormatSelector from './components/FormatSelector';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'settings' | 'help'>('home');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [history, setHistory] = useState<VideoMetadata[]>([]);
  const [downloadState, setDownloadState] = useState<DownloadState>({ isDownloading: false, progress: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState<string>(localStorage.getItem('ts_backend_url') || '');
  
  useEffect(() => {
    const saved = localStorage.getItem('ts_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (data: VideoMetadata) => {
    const updated = [data, ...history.filter(v => v.id !== data.id)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('ts_history', JSON.stringify(updated));
  };

  const handleSaveBackend = (val: string) => {
    let cleanUrl = val.trim();
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    setBackendUrl(cleanUrl);
    localStorage.setItem('ts_backend_url', cleanUrl);
    setShowToast("Backend URL Updated");
    setTimeout(() => setShowToast(null), 2000);
  };

  const handleAnalyze = async (targetUrl?: string) => {
    const input = targetUrl || url;
    if (!input || !YOUTUBE_REGEX.test(input)) {
      setError('Please enter a valid YouTube link.');
      return;
    }
    setError(null);
    setStatus(AppStatus.LOADING);
    try {
      const data = await fetchVideoMetadata(input);
      setMetadata(data);
      saveToHistory(data);
      setStatus(AppStatus.READY);
      setActiveTab('home');
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDownload = async (format: Format) => {
    if (!metadata) return;

    setDownloadState({ isDownloading: true, progress: 0, currentFormat: format, speed: backendUrl ? 'Streaming' : '45 MB/s' });
    setStatus(AppStatus.DOWNLOADING);

    if (backendUrl) {
      try {
        const downloadEndpoint = `${backendUrl}/download?url=${encodeURIComponent(url)}&format=${format.id}`;
        window.location.href = downloadEndpoint;
        await new Promise(r => setTimeout(r, 2000));
        setShowToast("Download started via Pro Engine");
      } catch (e) {
        setError("Backend connection failed. Check your URL in Settings.");
      }
      setDownloadState({ isDownloading: false, progress: 0 });
      setStatus(AppStatus.READY);
    } else {
      await simulateDownload((p) => setDownloadState(prev => ({ ...prev, progress: p })));
      const base64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZTU4LjI5LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA=";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: format.isAudioOnly ? 'audio/mpeg' : 'video/mp4' });
      const dUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dUrl;
      a.download = `${metadata.title.substring(0, 20)}_${format.quality}.${format.extension}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(dUrl);
      setShowToast("Sandbox demo file saved!");
      setTimeout(() => setShowToast(null), 3000);
      setDownloadState({ isDownloading: false, progress: 0 });
      setStatus(AppStatus.READY);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center">
      <header className="w-full max-w-2xl px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <Icons.Youtube />
          <h1 className="text-xl font-extrabold tracking-tighter">TUBE<span className="text-red-500">STREAM</span></h1>
        </div>
        <div className="flex gap-2">
           <div className={`px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${backendUrl ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${backendUrl ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${backendUrl ? 'text-emerald-400' : 'text-slate-400'}`}>
                {backendUrl ? 'PRO ENGINE ACTIVE' : 'SANDBOX MODE'}
              </span>
           </div>
        </div>
      </header>

      <main className="w-full max-w-2xl px-4 flex-1 pb-32">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {!metadata && (
              <div className="text-center space-y-2 py-10">
                <h2 className="text-4xl font-black text-white leading-tight">Video Downloads,<br/>Simplified.</h2>
                <p className="text-slate-400">Paste a link below to start high-speed analysis.</p>
              </div>
            )}

            <div className="relative group">
              <input 
                type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube or Shorts URL..."
                className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl py-6 px-6 focus:border-red-600 focus:ring-4 focus:ring-red-600/10 transition-all outline-none font-medium"
              />
              <button 
                onClick={() => handleAnalyze()}
                disabled={status === AppStatus.LOADING || !url}
                className="absolute right-3 top-3 bottom-3 px-8 bg-red-600 hover:bg-red-700 rounded-xl font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {status === AppStatus.LOADING ? '...' : 'Analyze'}
              </button>
            </div>

            {error && <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-xl text-red-400 text-sm flex gap-2 items-center"><Icons.Exclamation /> {error}</div>}

            {metadata && (
              <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                <VideoCard metadata={metadata} />
                <FormatSelector formats={metadata.formats} onDownload={handleDownload} isDownloading={downloadState.isDownloading} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold">Recent Library</h2>
            {history.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                Your history is empty. Analyze a video to see it here.
              </div>
            ) : (
              <div className="grid gap-4">
                {history.map(item => (
                  <div key={item.id} onClick={() => { setMetadata(item); setActiveTab('home'); setUrl(`https://youtube.com/watch?v=${item.id}`); }} className="glass-panel p-4 rounded-2xl flex gap-4 cursor-pointer hover:bg-slate-800/80 transition-all group">
                    <img src={item.thumbnail} className="w-24 aspect-video object-cover rounded-lg group-hover:scale-105 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.author} • {item.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold">System Settings</h2>
            <div className="glass-panel p-6 rounded-3xl space-y-6">
               <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Railway Backend URL</label>
                  <p className="text-xs text-slate-500 mb-4">Link your deployed Railway server here to enable real downloads.</p>
                  <input 
                    type="text" 
                    value={backendUrl} 
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://your-backend.up.railway.app"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 px-4 outline-none focus:border-emerald-500 transition-all font-mono text-sm"
                  />
                  <button 
                    onClick={() => handleSaveBackend(backendUrl)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all mt-2 shadow-lg shadow-emerald-600/20"
                  >
                    Save & Activate Pro Mode
                  </button>
               </div>
               
               <div className="pt-6 border-t border-slate-700">
                  <h4 className="text-sm font-bold mb-3 text-slate-400 uppercase tracking-widest">Local Storage</h4>
                  <button 
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    className="px-4 py-2 border border-red-500/30 text-xs text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Clear History & Cache
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-6 animate-in fade-in duration-500 overflow-y-auto max-h-[75vh] pb-20 pr-2 custom-scrollbar">
            <h2 className="text-2xl font-bold">Project Files & Deployment</h2>
            <p className="text-slate-400 text-sm">The full-stack structure is now ready. You can find the backend files in your project directory.</p>
            
            <div className="space-y-8">
              <section className="space-y-4">
                <Step number="1" title="Backend Folder Ready" desc="I have created a 'backend/' folder in this project containing 'server.js' and 'package.json'. You can copy these directly to your hosting provider." />
                
                <div className="glass-panel p-4 rounded-xl relative bg-emerald-500/5 border-emerald-500/20">
                   <h5 className="text-[10px] font-black text-emerald-500 uppercase mb-2">Pro Tip</h5>
                   <p className="text-xs text-slate-300">Zip the <strong>backend/</strong> folder, upload it to GitHub, and link it to Railway.app. No manual coding required!</p>
                </div>
              </section>

              <section className="space-y-4">
                <Step number="2" title="Deploy to Railway" desc="Go to Railway.app, create a new project from your GitHub repo. It will detect 'package.json' automatically." />
                <Step number="3" title="Link Public URL" desc="Copy the generated domain from Railway and paste it into the 'Settings' tab of this app." />
              </section>
            </div>
          </div>
        )}
      </main>

      {showToast && (
        <div className="fixed top-6 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-2xl z-[100] animate-in slide-in-from-top duration-300 flex items-center gap-2">
          <Icons.Check /> {showToast}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/80 backdrop-blur-3xl border-t border-white/5 z-50">
        <div className="max-w-2xl mx-auto flex justify-around">
          <NavBtn active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Icons.Link />} label="Paste" />
          <NavBtn active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Icons.Download />} label="Library" />
          <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon />} label="Settings" />
          <NavBtn active={activeTab === 'help'} onClick={() => setActiveTab('help')} icon={<div className="w-5 h-5 flex items-center justify-center font-bold">?</div>} label="Help" />
        </div>
      </nav>

      {downloadState.isDownloading && (
        <div className="fixed bottom-24 left-4 right-4 p-4 glass-panel rounded-2xl z-50 animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-red-500 uppercase tracking-tighter">
                {backendUrl ? 'Streaming via Private Engine...' : `Simulating ${downloadState.currentFormat?.quality}...`}
              </span>
              <span className="font-mono text-xs">{Math.round(downloadState.progress)}%</span>
           </div>
           <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${downloadState.progress}%` }}></div>
           </div>
        </div>
      )}
    </div>
  );
};

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.127c-.332.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-red-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const Step: React.FC<{ number: string; title: string; desc: string }> = ({ number, title, desc }) => (
  <div className="flex gap-4 items-start">
    <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-1">{number}</div>
    <div>
      <h4 className="font-bold text-white text-sm">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default App;
