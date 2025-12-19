const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/download', async (req, res) => {
  const { url, format } = req.query;
  try {
    const info = await ytdl.getInfo(url);
    res.header('Content-Disposition', 'attachment; filename="video.mp4"');
    ytdl(url, { quality: format || 'highest' }).pipe(res);
  } catch (err) { res.status(500).send(err.message); }
});

app.listen(process.env.PORT || 4000);