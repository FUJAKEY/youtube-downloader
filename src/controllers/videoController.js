const ytDlp = require('yt-dlp-exec');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

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
            // youtubeSkipDashManifest: true, // Removed to get more formats
            ffmpegLocation: ffmpegPath
        });

        const formats = output.formats
            // Filter for MP4s.
            // If ffmpeg is available, we technically *could* merge, but handling that in the UI selection is complex.
            // We will stick to formats that yt-dlp reports, but we'll try to be more inclusive.
            .filter(f => f.ext === 'mp4')
            .map(f => ({
                format_id: f.format_id,
                resolution: f.resolution || 'unknown',
                ext: f.ext,
                filesize: f.filesize ? (f.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A',
                acodec: f.acodec,
                vcodec: f.vcodec
            }));

        // Post-processing to identify "good" formats (Audio + Video)
        // If we have ffmpeg, we can potentially download video-only formats and merge,
        // but for this simple UI we'll just list what's available or "best".

        // Let's filter for display: must have video.
        // If it has no audio (acodec='none'), we mark it.
        let displayFormats = formats.filter(f => f.vcodec !== 'none').reverse();

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
        console.error('GetInfo Error:', error);
        res.render('dashboard', { video: null, error: 'Failed to fetch video info. Please check the URL and try again.' });
    }
};

exports.downloadVideo = async (req, res) => {
    const { url, format_id, title } = req.query;

    if (!url || !format_id) {
        return res.status(400).send('Missing URL or Format ID');
    }

    // Set no timeout for this request as downloads can be large
    req.setTimeout(0);

    try {
        // Safe filename handling
        const cleanTitle = (title || 'video').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        res.header('Content-Disposition', `attachment; filename="${cleanTitle}.mp4"`);

        // Construct flags
        const flags = {
            format: format_id,
            output: '-',
            noCallHome: true,
            noWarnings: true,
            forceIpv4: true, // Help with some network restrictions
            ffmpegLocation: ffmpegPath
        };

        // If format has no audio, and we have ffmpeg, yt-dlp *might* merge if we asked for 'video+audio',
        // but here we asked for a specific format_id.
        // If the user selected a video-only format (acodec='none'), they will get video only.
        // To support "Max Resolution" properly (which is often video-only + audio),
        // we would need to let the user select "Best Video + Best Audio" or similar.
        // But the UI lists specific format IDs.

        // However, standard use case: User picks a resolution.
        // If that resolution is only available as video-only DASH, we want to merge it with best audio.
        // If format_id is a DASH video id (e.g. 137), `yt-dlp -f 137+ba` works.
        // Let's detect if we should merge.
        // But we don't know the properties of format_id here without fetching info again.

        // Strategy: Just pass the format_id.
        // If the user selected a "dumb" format (video only), they get video only.
        // But typically HLS formats (with audio) are available for all resolutions on YT.

        const subprocess = ytDlp.exec(url, flags);

        subprocess.stdout.pipe(res);

        subprocess.stderr.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`);
        });

        subprocess.on('close', (code) => {
             if (code !== 0) {
                 console.error(`yt-dlp exited with code ${code}`);
                 // We can't send an error response if headers are already sent,
                 // but the stream will end.
             }
        });

    } catch (error) {
        console.error('Download Error:', error);
        if (!res.headersSent) {
            res.status(500).send('Error downloading video');
        }
    }
};
