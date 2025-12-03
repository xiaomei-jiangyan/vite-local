import fetch from "node-fetch";
import qs from "querystring";
import crypto from "crypto";

const BAIDU_APPID = "20251203002511474";
const BAIDU_SECRET = "1iq3t3bB9waFEJw8PEUJ";

const UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";

export async function translateByGoogle(text, to = "en") {
  const url =
    "https://translate.googleapis.com/translate_a/single?" +
    qs.stringify({
      client: "gtx",
      sl: "auto",
      tl: to,
      dt: "t",
      q: text,
    });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
      },
      timeout: 1000,
    });
    const data = await res.json();
    console.log("google", data);
    return data[0].map((item) => item[0]).join("");
  } catch (err) {
    console.warn(i18n.global.t("translate.1"), err.message);
    throw err;
  }
}

async function translateByBaidu(text, appid, secretKey, to = "en") {
  const salt = Date.now();
  const sign = crypto
    .createHash("md5")
    .update(appid + text + salt + secretKey)
    .digest("hex");

  const url =
    "https://fanyi-api.baidu.com/api/trans/vip/translate?" +
    qs.stringify({
      q: text,
      from: "auto",
      to,
      appid,
      salt,
      sign,
    });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
      },
      timeout: 1000,
    });
    const data = await res.json();
    // console.log(111, "data", data);
    if (data.error_code) {
      throw new Error(`Baidu Error: ${data.error_msg}`);
    }
    return data.trans_result.map((item) => item.dst).join("");
  } catch (err) {
    throw err;
  }
}

export async function translate(text, lang) {
  try {
    return await translateByGoogle(tex, lang);
  } catch (e) {
    return await translateByBaidu(text, BAIDU_APPID, BAIDU_SECRET, lang);
  }
}
// translate("你好世界", 'en').then(console.log);
