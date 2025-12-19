
export type VideoType = 'video' | 'shorts';

export interface Format {
  id: string;
  quality: string;
  extension: 'mp4' | 'mp3';
  size: string;
  label: string;
  isAudioOnly?: boolean;
}

export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  type: VideoType;
  formats: Format[];
}

export interface DownloadState {
  isDownloading: boolean;
  progress: number;
  currentFormat?: Format;
  eta?: string;
  speed?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  READY = 'READY',
  DOWNLOADING = 'DOWNLOADING',
  ERROR = 'ERROR'
}
