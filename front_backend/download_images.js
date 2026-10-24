const fs = require('fs');
const https = require('https');
const path = require('path');

const images = {
    // 한국 & 일본
    'KR_SEOUL.jpg': 'https://images.unsplash.com/photo-1538669715515-5c3b18538792?auto=format&fit=crop&q=80&w=800',
    'KR_JEJU.jpg': 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&q=80&w=800',
    'KR_BUSAN.jpg': 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&q=80&w=800',
    'KR_SOKCHO.jpg': 'https://images.unsplash.com/photo-1549675584-91f19337af3d?auto=format&fit=crop&q=80&w=800',
    'JP_TOKYO.jpg': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
    'JP_OSAKA.jpg': 'https://images.unsplash.com/photo-1590253230533-311824d55b06?auto=format&fit=crop&w=800',
    'JP_KYOTO.jpg': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800',
    'JP_FUKUOKA.jpg': 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&q=80&w=800',
    'JP_OKINAWA.jpg': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800',
    // 태국, 베트남, 싱가포르, 대만, 인도네시아
    'TH_BANGKOK.jpg': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
    'TH_CHIANGMAI.jpg': 'https://images.unsplash.com/photo-1512553353614-82a7370096dc?auto=format&fit=crop&w=800&q=80',
    'TH_PHUKET.jpg': 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
    'VN_HANOI.jpg': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    'VN_DANANG.jpg': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    'VN_HOCHIMINH.jpg': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
    'SG_SINGAPORE.jpg': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
    'TW_TAIPEI.jpg': 'https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=800&q=80',
    'TW_KAOHSIUNG.jpg': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    'ID_BALI.jpg': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    // 유럽
    'FR_PARIS.jpg': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    'GB_LONDON.jpg': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    'ES_BARCELONA.jpg': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
    'IT_ROME.jpg': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=800&q=80',
    'DE_BERLIN.jpg': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80',
    'NL_AMSTERDAM.jpg': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=800&q=80',
    'CH_ZURICH.jpg': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80',
    // 북미 & 남미
    'US_NEWYORK.jpg': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    'US_LA.jpg': 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=800&q=80',
    'US_HAWAII.jpg': 'https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=800&q=80',
    'PE_CUSCO.jpg': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
    // 오세아니아 & 아프리카
    'AU_SYDNEY.jpg': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
    'EG_CAIRO.jpg': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80'
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
