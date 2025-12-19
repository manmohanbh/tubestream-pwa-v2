
import React from 'react';
import { VideoMetadata } from '../types';

interface VideoCardProps {
  metadata: VideoMetadata & { sources?: any[] };
}

const VideoCard: React.FC<VideoCardProps> = ({ metadata }) => {
  return (
    <div className="w-full glass-panel rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      <div className="relative aspect-video bg-slate-900">
        <img 
          src={metadata.thumbnail} 
          alt={metadata.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback for missing high-res thumbnails
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${metadata.id}/hqdefault.jpg`;
          }}
        />
        <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-xs font-bold text-white">
          {metadata.duration}
        </div>
        {metadata.type === 'shorts' && (
          <div className="absolute top-3 left-3 bg-red-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter text-white">
            Shorts
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold line-clamp-2 mb-1">{metadata.title}</h3>
        <p className="text-slate-400 text-sm mb-4">Channel: {metadata.author}</p>
        
        <div className="flex flex-wrap gap-2 items-center justify-between">
           <div className="flex gap-2">
             <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 font-medium tracking-tight">#{metadata.type}</span>
             <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 font-medium tracking-tight">ID: {metadata.id}</span>
           </div>
           
           {/* Compliance: Show grounding source if available */}
           {metadata.sources && metadata.sources.length > 0 && (
             <div className="text-[10px] text-slate-500 italic flex items-center gap-1">
               Source verified via 
               <a 
                 href={metadata.sources[0]?.web?.uri || '#'} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-red-400 hover:underline"
               >
                 Google Search
               </a>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
