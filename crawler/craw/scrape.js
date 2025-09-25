// 需要安装依赖：npm install axios cheerio fs
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const BASE_URL = "https://japaninternships.com";
const START_URL = `${BASE_URL}/career-fields/page/`; // 假设分页是这个规律
const TOTAL_PAGES = 16;

async function scrape() {
  const results = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = `${START_URL}${page}/`;
    console.log(`抓取列表页: ${url}`);

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    // 提取详情页链接
    const detailLinks = [];
    $("a.c-article-5__link").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (text.includes("Read more") && href) {
        detailLinks.push(href.startsWith("/") ? BASE_URL + href : href);
      }
    });

    // 逐个抓详情页
    for (const detailUrl of detailLinks) {
      console.log("  抓取详情页:", detailUrl);
      const detailRes = await axios.get(detailUrl);
      const $$ = cheerio.load(detailRes.data);

      const title = $$("h1").first().text().trim();
      const content = $$("p")
        .map((i, el) => $$(el).text().trim())
        .get()
        .join(" ");

      results.push({ url: detailUrl, title, content });
    }
  }

  fs.writeFileSync("internships.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("✅ 爬取完成，保存到 internships.json");
}

scrape();
