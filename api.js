const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const NodeCache = require("node-cache");
const he = require("he");
const app = express();

// Create a cache with a 10-minute expiration time
const cache = new NodeCache({ stdTTL: 600 });

async function fetchCoupons() {
  try {
    // Check if data is cached
    const cachedData = cache.get("courses");
    if (cachedData) {
      return cachedData;
    }

    const response = await axios.get("https://www.discudemy.com/all");
    const $ = cheerio.load(response.data);
    const linkClass = $(".card-header");
    const hn = [];

    linkClass.each((idx, item) => {
      const href = $(item).attr("href");
      hn.push(href);
    });

    const goLinks = await Promise.all(
      hn.map(async (link) => {
        try {
          const res = await axios.get(link);
          const $ = cheerio.load(res.data);
          const linkClass = $(".ui.center.aligned.basic.segment")
            .find("a")
            .attr("href");
          return linkClass;
        } catch (error) {
          console.error("Error fetching go link:", error);
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
            const coupon = $(".ui.segment").find("a").attr("href");
            const title = $(".ui.grey.header").text();
            return { title, coupon };
          } catch (error) {
            console.error("Error fetching coupon:", error);
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
    cache.set("courses", validCoupons);

    return validCoupons;
  } catch (error) {
    throw error;
  }
}

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

app.get("/json", async (req, res) => {
  try {
    const courses = await fetchCoupons();
    res.json(courses);
  } catch (error) {
    console.error("An error occurred while fetching coupons:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching coupons." });
  }
});

app.get("/xml", async (req, res) => {
  try {
    const courses = await fetchCoupons();
    const xml = `<courses>${courses
      .map(
        (course) =>
          `<course><title>${he.encode(course.title)}</title><coupon>${he.encode(
            course.coupon
          )}</coupon></course>`
      )
      .join("")}</courses>`;
    res.type("application/xml");
    res.send(xml);
  } catch (error) {
    console.error("An error occurred while fetching coupons:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching coupons." });
  }
});

app.get("/csv", async (req, res) => {
  try {
    const courses = await fetchCoupons();
    const csv = courses
      .map((course) => `${he.encode(course.title)},${he.encode(course.coupon)}`)
      .join("\n");
    res.type("text/csv");
    res.send(csv);
  } catch (error) {
    console.error("An error occurred while fetching coupons:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching coupons." });
  }
});

app.get("/txt", async (req, res) => {
  try {
    const courses = await fetchCoupons();
    let responseText = "";

    for (const course of courses) {
      responseText += `Title: ${he.encode(course.title)}, Coupon: ${he.encode(
        course.coupon
      )}\n`;
    }

    responseText += "\n©well300 by GetBenefits\n";
    res.type("text/plain");
    res.send(responseText);
  } catch (error) {
    console.error("An error occurred while fetching coupons:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching coupons." });
  }
});

// Serve the index.html file for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
