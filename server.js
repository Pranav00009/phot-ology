const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(__dirname));

// Ensure assets directories exist
const videosDir = path.join(__dirname, 'assets', 'videos');
const imagesDir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype.startsWith('video/')) {
            cb(null, videosDir);
        } else if (file.mimetype.startsWith('image/')) {
            cb(null, imagesDir);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_ ()]/g, '');
        cb(null, Date.now() + '-' + safeName);
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 500 * 1024 * 1024 } });

const mediaJsonPath = path.join(__dirname, 'assets', 'media.json');

function getMediaList() {
    if (!fs.existsSync(mediaJsonPath)) return [];
    return JSON.parse(fs.readFileSync(mediaJsonPath, 'utf8'));
}

function saveMediaList(list) {
    fs.writeFileSync(mediaJsonPath, JSON.stringify(list, null, 2));
}

app.get('/api/media', (req, res) => {
    res.json(getMediaList());
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const file = req.file;
        const isVideo = file.mimetype.startsWith('video/');
        const folder = isVideo ? 'videos' : 'images';
        
        const newMedia = {
            name: file.originalname,
            url: `assets/${folder}/${file.filename}`,
            type: file.mimetype,
            size: file.size,
            timestamp: Date.now(),
            isProjectFile: true
        };
        
        const mediaList = getMediaList();
        mediaList.unshift(newMedia);
        saveMediaList(mediaList);
        
        res.json({ success: true, media: newMedia });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/add-local', (req, res) => {
    try {
        const newMedia = req.body;
        const mediaList = getMediaList();
        mediaList.unshift(newMedia);
        saveMediaList(mediaList);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reorder', (req, res) => {
    try {
        const { mediaList } = req.body;
        saveMediaList(mediaList);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/media/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const mediaList = getMediaList();
        
        if (index >= 0 && index < mediaList.length) {
            const item = mediaList[index];
            if (item.url && !item.url.startsWith('blob:') && !item.url.startsWith('data:')) {
                const filePath = path.join(__dirname, item.url);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            mediaList.splice(index, 1);
            saveMediaList(mediaList);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(` PHOTOLOGY ADMIN SERVER RUNNING ON PORT ${PORT}`);
    console.log(` Access website: http://localhost:${PORT}`);
    console.log(` Admin panel: http://localhost:${PORT}/admin/login.html`);
    console.log(`==============================================\n`);
});
