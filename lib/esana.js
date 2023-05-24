const axios = require("axios");
const cheerio = require("cheerio");
const request = require('request');

function kaveesha_apis() {
    return new Promise(async (resolve, reject) => {
        const GIST_URL = "https://gist.github.com/BlackAmda/39d21470e6cf2bdb1039d7a774cd9496"
        request(GIST_URL, (error, response, body) => {
            const $ = cheerio.load(body)
            const json = {
                gist_link:
                    'https://gist.githubusercontent.com' +
                    $(
                        '#file-custom_api_urls-json > div.file-header.d-flex.flex-md-items-center.flex-items-start > div.file-actions.flex-order-2.pt-0 > a'
                    ).attr('href'),
            }
            
            resolve(json.gist_link);
        })
    })
}

module.exports.esana_latest = () => {
    return new Promise(async (resolve, reject) => {
        kaveesha_apis()
            .then(async (data) => {
                const response = await axios.get(data);
                const api_url = response.data
                const api_res = await axios.get(api_url.kaveesha.esana)
                resolve(api_res.data);
            })
            .catch((e) => {
                reject(e);
            })
    })
}