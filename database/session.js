const fs = require("fs");
const { DATABASE, auth_state } = require("./db")

// * Writing auth state in SQL DB -- If using a SQL DB
async function fetchauth() {
    await DATABASE.sync();
    var result = await auth_state.findAll({
        where: { id: 1 }
    });
    
    if (result.length < 1) {
        return false;
    } else {
        fs.writeFileSync("./esana_bot_auth/creds.json", JSON.stringify(JSON.parse(result[0].dataValues.session)));
        return true;
    }
};

// * Updating SQL auth DB with new auth state -- If using a SQL DB
async function updateAuth(inserDataInDB) {
    await DATABASE.sync();
    var result = await auth_state.findAll({
        where: { id: 1 }
    });

    if (result.length < 1) {
        await auth_state.create({ id: 1, session: inserDataInDB });
    } else {
        await result[0].update({ id: 1, session: inserDataInDB });
    }
};

module.exports = { fetchauth, updateAuth }