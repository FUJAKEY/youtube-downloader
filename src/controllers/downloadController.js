const ytdl = require('ytdl-core');
const { fetch } = require('undici');

const QUALITY_MAP = ['360', '480', '720', '1080', '1440', '2160'];
const YT_REQUEST_OPTIONS = {
  headers: {
    // Спуфим браузерный UA, чтобы избежать 410 при прямом доступе к CDN
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'accept-language': 'en-US,en;q=0.9'
  }
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
      return ytdl(url, {
        format: targetFormat,
        requestOptions: YT_REQUEST_OPTIONS,
        highWaterMark: 1 << 25
      }).pipe(res);
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
