const { DATABASE, postedE } = require("./db")

module.exports.postedEsanaNews = async (esanaNews) => {
    await DATABASE.sync();

    var data = await postedE.findAll({ where: { id: 1 } });

    if (data.length < 1) {
        return await postedE.create({ id: 1, esanaNews: esanaNews.news_id, newsData: JSON.stringify(esanaNews) });
    } else {
        return await data[0].update({ esanaNews: esanaNews.news_id, newsData: JSON.stringify(esanaNews) });
    }
}

module.exports.get_EsanaPosted = async () => {
    await DATABASE.sync();
    var result = await postedE.findAll({ where: { id: 1 } });

    if (result.length < 1) {
        return false;
    } else {
        return result[0].dataValues;
    }
}