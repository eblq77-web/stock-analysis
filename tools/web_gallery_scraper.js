/**
 * 🕷️ Web Gallery Scraper - Node.js Version
 * ==========================================
 * Scrapes images from websites and creates galleries
 * 
 * Usage: node web_gallery_scraper.js <url> [options]
 * 
 * Options:
 *   --limit N        Max images (default: 20)
 *   --output DIR     Output folder (default: ./gallery_downloads)
 *   --gallery       Create HTML gallery after download
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Arguments
const args = process.argv.slice(2);
let url = args[0];
let limit = 20;
let outputDir = './gallery_downloads';
let createGallery = false;

// Parse options
for (let i = 1; i < args.length; i++) {
    if (args[i] === '--limit' && args[i+1]) {
        limit = parseInt(args[i+1]);
        i++;
    } else if (args[i] === '--output' && args[i+1]) {
        outputDir = args[i+1];
        i++;
    } else if (args[i] === '--gallery') {
        createGallery = true;
    }
}

if (!url) {
    console.log('Usage: node web_gallery_scraper.js <url> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --limit N        Max images (default: 20)');
    console.log('  --output DIR     Output folder (default: ./gallery_downloads)');
    console.log('  --gallery        Create HTML gallery');
    console.log('');
    console.log('Examples:');
    console.log('  node web_gallery_scraper.js https://unsplash.com --limit 10 --gallery');
    console.log('  node web_gallery_scraper.js https://pexels.com --output my_images');
    process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('\n🕷️ Web Gallery Scraper');
console.log('======================\n');
console.log(`URL: ${url}`);
console.log(`Limit: ${limit} images`);
console.log(`Output: ${outputDir}\n`);

// Fetch HTML
function fetchHTML(targetUrl) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(targetUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        };
        
        client.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Extract image URLs
function extractImages(html, baseUrl) {
    const imageUrls = [];
    const parsedUrl = new URL(baseUrl);
    
    // Common image patterns
    const patterns = [
        /src="([^"]+\.(jpg|jpeg|png|gif|webp|svg)[^"]*)"/gi,
        /src='([^']+\.(jpg|jpeg|png|gif|webp|svg)[^']*)'/gi,
        /url\(([^)]+\.(jpg|jpeg|png|gif|webp|svg)[^)]*)\)/gi,
        /data-src="([^"]+)"/gi,
        /data-lazy-src="([^"]+)"/gi
    ];
    
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            let imgUrl = match[1];
            
            // Handle relative URLs
            if (imgUrl.startsWith('//')) {
                imgUrl = parsedUrl.protocol + imgUrl;
            } else if (imgUrl.startsWith('/')) {
                imgUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${imgUrl}`;
            } else if (!imgUrl.startsWith('http')) {
                imgUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/${imgUrl}`;
            }
            
            // Filter valid images
            if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imgUrl) && 
                !imgUrl.includes('data:') &&
                !imageUrls.includes(imgUrl)) {
                imageUrls.push(imgUrl);
            }
        }
    }
    
    return imageUrls.slice(0, limit);
}

// Download image
function downloadImage(imgUrl, index) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(imgUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        // Get file extension
        let ext = path.extname(parsedUrl.pathname) || '.jpg';
        if (!ext.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            ext = '.jpg';
        }
        
        const filename = `image_${String(index).padStart(3, '0')}${ext}`;
        const filepath = path.join(outputDir, filename);
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        };
        
        client.get(options, (res) => {
            // Handle redirects
            if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
                downloadImage(res.headers.location, index)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            const file = fs.createWriteStream(filepath);
            res.pipe(file);
            file.on('finish', () => {
                const stats = fs.statSync(filepath);
                console.log(`✅ Downloaded: ${filename} (${(stats.size/1024).toFixed(1)}KB)`);
                resolve({ filename, size: stats.size });
            });
        }).on('error', (err) => {
            console.log(`❌ Failed: ${imgUrl}`);
            resolve(null);
        });
    });
}

// Create gallery HTML
function createGalleryHTML() {
    const files = fs.readdirSync(outputDir).filter(f => 
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f)
    );
    
    const htmlFile = path.join(outputDir, 'gallery.html');
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🖼️ Image Gallery</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            min-height: 100vh;
            padding: 20px;
        }
        h1 { text-align: center; color: #fff; margin: 30px 0; }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            overflow: hidden;
            transition: transform 0.3s;
        }
        .card:hover { transform: scale(1.05); }
        .card img { width: 100%; height: 180px; object-fit: cover; }
        .card-info { padding: 10px; color: #fff; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🖼️ Downloaded Gallery (${files.length} images)</h1>
    <div class="gallery">
`;
    
    for (const file of files) {
        const stats = fs.statSync(path.join(outputDir, file));
        html += `        <div class="card">
            <img src="${file}" alt="${file}">
            <div class="card-info">${file}<br>${(stats.size/1024).toFixed(1)}KB</div>
        </div>\n`;
    }
    
    html += `    </div>
</body>
</html>`;
    
    fs.writeFileSync(htmlFile, html);
    console.log(`\n✅ Gallery created: ${htmlFile}`);
    
    // Try to open
    try {
        require('child_process').execSync(`open "${htmlFile}"`, { stdio: 'ignore' });
    } catch (e) {}
}

// Main
async function main() {
    try {
        console.log('📥 Fetching HTML...');
        const html = await fetchHTML(url);
        
        console.log('🔍 Extracting images...');
        const images = extractImages(html, url);
        console.log(`Found ${images.length} images\n`);
        
        console.log('📦 Downloading...');
        const downloaded = [];
        for (let i = 0; i < Math.min(images.length, limit); i++) {
            const result = await downloadImage(images[i], i + 1);
            if (result) downloaded.push(result);
        }
        
        console.log(`\n✅ Downloaded ${downloaded.length} images to ${outputDir}`);
        
        if (createGallery) {
            createGalleryHTML();
        }
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

main();
