
const fs = require('fs');
const https = require('https');
const path = require('path');

const images = {
    'JP_FUKUOKA.jpg': 'https://images.unsplash.com/photo-1590233735500-664426540498?auto=format&fit=crop&q=80&w=800',
    'FR_PARIS.jpg': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
    'ES_BARCELONA.jpg': 'https://images.unsplash.com/photo-1583422422116-392942474f63?auto=format&fit=crop&q=80&w=800',
    'IT_ROME.jpg': 'https://images.unsplash.com/photo-1552832230-c0197dd3ef1b?auto=format&fit=crop&q=80&w=800',
    'DE_BERLIN.jpg': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=80&w=800'
};

const targetDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

Object.entries(images).forEach(([filename, url]) => {
    const filePath = path.join(targetDir, filename);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`✅ Downloaded: ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        console.error(`❌ Error downloading ${filename}:`, err.message);
    });
});
