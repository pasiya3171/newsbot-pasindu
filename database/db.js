const fs = require("fs")
const { DataTypes, Sequelize } = require("sequelize");
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

const DATABASE = process.env.DATABASE_URL === "local" ?
    new Sequelize({ dialect: 'sqlite', storage: "./database/esana.db", logging: false }) :
    new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        ssl: true,
        protocol: 'postgres',
        dialectOptions: { native: true, ssl: { require: true, rejectUnauthorized: false } },
        logging: false
    })

const postedE = DATABASE.define("posted_esana", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    esanaNews: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    newsData: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, { timestamps: false });

const auth_state = DATABASE.define("auth_state", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    session: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, { timestamps: false });

module.exports = {
    DATABASE, postedE, auth_state
}