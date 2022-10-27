const dot = require("dotenv").config();
const config = {
  dev: {
    password: process.env.DATABASE_PASSWORD,
    database: "gb_project",
    host: "127.0.0.1",
    username: "admin",
    dialect: "mysql",
    logging: false,
    //
    // ㅜ 한국 시간 설정
    timezone: "+09:00",
    dialectOptions: {
      typeCast: true,
      dateStrings: true,
    },
  },
};
module.exports = config;
