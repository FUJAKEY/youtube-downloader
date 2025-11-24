const ytDlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');

exports.dashboard = (req, res) => {
    res.render('dashboard', { video: null, error: null });
};

exports.getVideoInfo = async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.render('dashboard', { video: null, error: 'Please provide a URL' });
    }

    try {
        const output = await ytDlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true
        });

        const formats = output.formats
            .filter(f => f.ext === 'mp4' && f.acodec !== 'none') // Filter for mp4 and audio
            .map(f => ({
                format_id: f.format_id,
                resolution: f.resolution || 'unknown',
                ext: f.ext,
                filesize: f.filesize ? (f.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'
            }));

        // If no formats found with audio (common in high res YT), we might need to handle merging,
        // but for simplicity in this node app, we'll try to find "best" pre-merged or just list what's available.
        // For TikTok, it usually gives a direct link.

        // Let's refine the filter.
        let displayFormats = [];
        if (output.extractor === 'tiktok') {
             displayFormats.push({
                 format_id: 'best',
                 resolution: 'Best Available',
                 ext: 'mp4',
                 filesize: 'N/A'
             });
        } else {
             // Youtube
             displayFormats = output.formats.filter(f => f.ext === 'mp4' && f.acodec !== 'none').reverse();
        }

        res.render('dashboard', {
            video: {
                title: output.title,
                thumbnail: output.thumbnail,
                url: url,
                formats: displayFormats
            },
            error: null
        });

    } catch (error) {
        console.error(error);
        res.render('dashboard', { video: null, error: 'Failed to fetch video info. Check the URL.' });
    }
};

exports.downloadVideo = async (req, res) => {
    const { url, format_id } = req.query;

    if (!url || !format_id) {
        return res.status(400).send('Missing URL or Format ID');
    }

    try {
        res.header('Content-Disposition', `attachment; filename="video.mp4"`);

        // Stream the download
        const subprocess = ytDlp.exec(url, {
            format: format_id,
            output: '-'
        });

        subprocess.stdout.pipe(res);

        subprocess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading video');
    }
};
