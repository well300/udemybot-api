const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const app = express();

// Create a cache with a 10-minute expiration time
const cache = new NodeCache({ stdTTL: 600 });

async function fetchCoupons() {
    try {
        // Check if data is cached
        const cachedData = cache.get('courses');
        if (cachedData) {
            return cachedData;
        }

        const response = await axios.get('https://www.discudemy.com/all');
        const $ = cheerio.load(response.data);
        const linkClass = $('.card-header');
        const hn = [];

        linkClass.each((idx, item) => {
            const href = $(item).attr('href');
            hn.push(href);
        });

        const goLinks = await Promise.all(
            hn.map(async (link) => {
                try {
                    const res = await axios.get(link);
                    const $ = cheerio.load(res.data);
                    const linkClass = $('.ui.center.aligned.basic.segment').find('a').attr('href');
                    return linkClass;
                } catch (error) {
                    console.error('Error fetching go link:', error);
                    return null;
                }
            })
        );

        const coupons = await Promise.all(
            goLinks.map(async (couponLink) => {
                if (couponLink) {
                    try {
                        const res = await axios.get(couponLink);
                        const $ = cheerio.load(res.data);
                        const coupon = $('.ui.segment').find('a').attr('href');
                        const title = $('.ui.grey.header').text();
                        return { title, coupon };
                    } catch (error) {
                        console.error('Error fetching coupon:', error);
                        return null;
                    }
                } else {
                    return null;
                }
            })
        );

        // Filter out null values (failed requests)
        const validCoupons = coupons.filter((coupon) => coupon !== null);

        // Cache the fetched courses
        cache.set('courses', validCoupons);

        return validCoupons;
    } catch (error) {
        throw error;
    }
}

app.get('/', async (req, res) => {
    try {
        const courses = await fetchCoupons();

        // Set the response content type based on the requested format
        const contentType = req.accepts(['json', 'xml', 'yaml', 'text', 'csv']);
        res.type(contentType);

        // Format the response based on the requested format
        switch (contentType) {
            case 'json':
                res.json(courses);
                break;
            case 'xml':
                // Format courses as XML and send the response
                const xml = `<courses>${courses.map(course => `<course><title>${course.title}</title><coupon>${course.coupon}</coupon></course>`).join('')}</courses>`;
                res.send(xml);
                break;
            case 'yaml':
                // Format courses as YAML and send the response
                const yaml = require('js-yaml').dump(courses);
                res.send(yaml);
                break;
            case 'text':
                // Format courses as plain text and send the response
                const text = courses.map(course => `Title: ${course.title}, Coupon: ${course.coupon}`).join('\n') +
                    '\n©well300 by GetBenefits\n';
                res.send(text);
                break;
            case 'csv':
                // Format courses as CSV and send the response
                const csv = courses.map(course => `${course.title},${course.coupon}`).join('\n');
                res.send(csv);
                break;
            default:
                res.status(406).send('Not Acceptable');
        }
    } catch (error) {
        console.error('An error occurred while fetching coupons:', error);
        res.status(500).json({ error: 'An error occurred while fetching coupons.' });
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
