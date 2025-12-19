
const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Download Endpoint
app.get('/download', async (req, res) => {
  const { url, format } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  try {
    // Validate URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Fetch video info to get a clean title
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '') || 'video';
    
    // Set headers for file download
    const extension = format === 'mp3-320' ? 'mp3' : 'mp4';
    res.header('Content-Disposition', `attachment; filename="${title}.${extension}"`);

    // Stream the video/audio directly to the response
    const options = {
      quality: format && format !== 'mp3-320' ? format : 'highest',
      filter: format === 'mp3-320' ? 'audioonly' : 'videoandaudio'
    };

    ytdl(url, options)
      .on('error', (err) => {
        console.error('YTDL Error:', err);
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error during streaming');
        }
      })
      .pipe(res);

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Failed to process video: ' + err.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('Backend is healthy');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`TubeStream Backend running on port ${PORT}`);
});
