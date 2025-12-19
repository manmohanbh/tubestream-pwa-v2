
import React from 'react';
import { Format } from '../types';
import { Icons } from '../constants';

interface FormatSelectorProps {
  formats: Format[];
  onDownload: (format: Format) => void;
  isDownloading: boolean;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ formats, onDownload, isDownloading }) => {
  const videoFormats = formats.filter(f => !f.isAudioOnly);
  const audioFormats = formats.filter(f => f.isAudioOnly);

  return (
    <div className="w-full space-y-6">
      <section>
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Video Formats (MP4)</h4>
        <div className="grid grid-cols-1 gap-2">
          {videoFormats.map((format) => (
            <button
              key={format.id}
              disabled={isDownloading}
              onClick={() => onDownload(format)}
              className="flex items-center justify-between p-4 glass-panel rounded-xl hover:bg-slate-700/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center text-red-500 font-bold text-xs">
                  {format.quality.split('p')[0]}
                </div>
                <div>
                  <div className="font-semibold">{format.label}</div>
                  <div className="text-xs text-slate-400">{format.quality} • {format.size}</div>
                </div>
              </div>
              <div className="text-slate-500 group-hover:text-red-500 transition-colors">
                <Icons.Download />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Audio Only (MP3)</h4>
        <div className="grid grid-cols-1 gap-2">
          {audioFormats.map((format) => (
            <button
              key={format.id}
              disabled={isDownloading}
              onClick={() => onDownload(format)}
              className="flex items-center justify-between p-4 glass-panel rounded-xl hover:bg-slate-700/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold text-xs uppercase">
                  MP3
                </div>
                <div>
                  <div className="font-semibold">{format.label}</div>
                  <div className="text-xs text-slate-400">{format.quality} • {format.size}</div>
                </div>
              </div>
              <div className="text-slate-500 group-hover:text-blue-500 transition-colors">
                <Icons.Download />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FormatSelector;
