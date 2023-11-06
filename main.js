const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const app = express();

// Create a cache with a 10-minute expiration time
const cache = new NodeCache({ stdTTL: 600 });

function fetchCoupons() {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if data is cached
            const cachedData = cache.get('courses');
            if (cachedData) {
                return resolve(cachedData);
            }

            const response = await axios.get('https://www.discudemy.com/all');
            const $ = cheerio.load(response.data);
            const linkClass = $('.card-header');
            const hn = [];

            linkClass.each((idx, item) => {
                const href = $(item).attr('href');
                hn.push(href);
            });

            const goLinks = [];

            for (const link of hn) {
                try {
                    const res = await axios.get(link);
                    const $ = cheerio.load(res.data);
                    const linkClass = $('.ui.center.aligned.basic.segment').find('a').attr('href');
                    goLinks.push(linkClass);
                } catch (error) {
                    console.error('Error fetching go link:', error);
                }
            }

            const coupons = [];
            const titles = [];

            for (const couponLink of goLinks) {
                try {
                    const res = await axios.get(couponLink);
                    const $ = cheerio.load(res.data);
                    const coupon = $('.ui.segment').find('a').attr('href');
                    const title = $('.ui.grey.header').text();
                    coupons.push(coupon);
                    titles.push(title);
                } catch (error) {
                    console.error('Error fetching coupon:', error);
                }
            }

            // Cache the fetched courses
            cache.set('courses', { coupons, titles });

            resolve({ coupons, titles });
        } catch (error) {
            reject(error);
        }
    });
}
app.get('/fetch-coupons', async (req, res) => {
    try {
        const { coupons, titles } = await fetchCoupons();
        const data = titles.map((title, index) => ({
            title,
            courses: coupons[index],  
            by: 'BY GETBENEFITS'        
        }));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching coupons.' });
    }
});

const port = process.env.PORT || 300;

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
