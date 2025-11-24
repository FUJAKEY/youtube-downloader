const ytdl = require('@distube/ytdl-core');
const { fetch } = require('undici');

const QUALITY_MAP = ['360', '480', '720', '1080', '1440', '2160'];
const YT_HEADERS = {
  // Больше браузерных заголовков для обхода CDN-блокировок
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  origin: 'https://www.youtube.com',
  referer: 'https://www.youtube.com/',
  dnt: '1'
};
const YT_REQUEST_OPTIONS = {
  headers: YT_HEADERS,
  // уменьшаем количество перезапросов и уменьшаем шанс 410
  maxRetries: 3,
  maxReconnects: 5,
  backoff: { inc: 200, max: 2000 }
};

function detectSource(url) {
  if (/tiktok\.com\//i.test(url)) return 'tiktok';
  if (/youtu(be)?\.\w+\//i.test(url)) return 'youtube';
  return null;
}

function sanitizeFilename(title) {
  return title.replace(/[^a-zA-Z0-9А-Яа-я0-9 _.-]/g, '').slice(0, 80) || 'video';
}

async function downloadVideo(req, res) {
  const { url, quality } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'Передайте ссылку на видео' });
  }

  const source = detectSource(url);
  if (!source) {
    return res.status(400).json({ message: 'Поддерживаются только ссылки на YouTube и TikTok' });
  }

  if (source === 'youtube') {
    try {
      if (!ytdl.validateURL(url)) {
        return res.status(400).json({ message: 'Некорректная ссылка на YouTube' });
      }

      const info = await ytdl.getInfo(url, { requestOptions: YT_REQUEST_OPTIONS });
      const formats = info.formats.filter((f) => f.hasAudio && f.hasVideo && f.container === 'mp4');
      let targetFormat;
      if (quality === 'best') {
        targetFormat = ytdl.chooseFormat(formats, { quality: 'highest' });
      } else if (QUALITY_MAP.includes(quality)) {
        targetFormat = formats.find((f) => f.qualityLabel?.startsWith(`${quality}p`));
      }
      if (!targetFormat) {
        targetFormat = ytdl.chooseFormat(formats, { quality: 'highest' });
      }
      const safeTitle = sanitizeFilename(info.videoDetails.title);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}-${targetFormat.qualityLabel || 'best'}.mp4"`);

      const stream = ytdl.downloadFromInfo(info, {
        format: targetFormat,
        requestOptions: YT_REQUEST_OPTIONS,
        highWaterMark: 1 << 25,
        // dlChunkSize 0 => единым запросом, чтобы не ловить 410 на чанках CDN
        dlChunkSize: 0
      });

      stream.on('error', (err) => {
        console.error('YT stream error', err);
        if (!res.headersSent) {
          res.status(502).json({ message: 'Поток YouTube прерван. Попробуйте другое качество.' });
        } else {
          res.destroy(err);
        }
      });

      return stream.pipe(res);
    } catch (error) {
      console.error('YT download error', error);
      if (error?.statusCode === 410) {
        return res.status(410).json({
          message: 'YouTube вернул временную ошибку (410). Попробуйте другое качество или повторите попытку позже.'
        });
      }
      return res.status(500).json({ message: 'Не удалось подготовить загрузку YouTube' });
    }
  }

  if (source === 'tiktok') {
    try {
      const tikwm = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
      const data = await tikwm.json();
      if (data.code !== 0 || !data.data?.play) {
        return res.status(400).json({ message: 'Не удалось разобрать ссылку TikTok' });
      }
      const videoUrl = data.data.play;
      const stream = await fetch(videoUrl);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="tiktok-video.mp4"');
      stream.body.pipe(res);
    } catch (error) {
      console.error('TT download error', error);
      return res.status(500).json({ message: 'Не удалось подготовить загрузку TikTok' });
    }
  }
}

module.exports = {
  downloadVideo
};
