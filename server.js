const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/extract', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        let m3u8Url = null;

        page.on('request', request => {
            const reqUrl = request.url();
            if (reqUrl.includes('.m3u8') && !m3u8Url) {
                m3u8Url = reqUrl;
            }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

        await browser.close();

        if (m3u8Url) {
            res.json({ success: true, m3u8: m3u8Url });
        } else {
            res.status(404).json({ success: false, message: 'No .m3u8 stream found' });
        }
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
