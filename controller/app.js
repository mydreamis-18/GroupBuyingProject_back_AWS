///////////////////////////////////
// ㅜ 백엔드에서 사용한 npm 전체 모듈
// styled-components
// react-router-dom
// express-session
// jsonwebtoken
// redux-thunk
// react-redux
// sequelize
// express
// mysql2
// dotenv
// multer
// redux
// bcypt
// axios
// cors
//
////////////////
// ㅜ server 연결
const express = require("express");
const app = express();
const PORT = 8000;
app.listen(PORT, () => console.log("PORT", PORT));
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ㅜ 브라우저가 서로 다른 도메인/포트의 서버로 요청했을 때 발생하는 cors 에러를 위해 해당 도메인에 대하여 접근 허용 설정
const options = { origin: "http://15.165.19.0" };
const cors = require("cors");
app.use(cors(options));
//
///////////////////////////////////////////////
// ㅜ 전달 받은 객체를 해석해서 사용할 수 있게 설정
app.use(express.json());
//
///////////////////////////
// ㅜ 서버 실행 시 MySQL 연동
const { sequelize, User } = require("../model");
sequelize.sync({ force: false }).then(() => console.log("MySQL"));
//
/////////////////////////////////////////
// ㅜ 토큰 검증 시 사용되는 세션에 대한 모듈
const session = require("express-session");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
  })
);
//
//////////////////////////////////
// ㅜ 라우터의 요청 주소에 대한 설정
const { userRouter, productRouter, transactionRouter } = require(".");
app.use("/", transactionRouter);
app.use("/", productRouter);
app.use("/", userRouter);
//
/////////////////////
// ㅜ 관리자 계정 생성
const bcrypt = require("bcrypt");
app.post("/", async (req, res) => {
  //
  let adminAccountNum = null;
  const admin = "admin";
  const SALT = Number(process.env.BCRYPT_SALT);
  //
  adminAccountNum = await User.findOne({ where: { user_id: admin }, attributes: ["id"] });
  if (adminAccountNum === null) {
    //
    const password = process.env.ADMIN_ACCOUNT_PASSWORD;
    const _password = await bcrypt.hash(password, SALT);
    //
    adminAccountNum = await User.create({ user_id: admin, nickname: admin, password: _password });
  }
  adminAccountNum = adminAccountNum.dataValues.id;
  res.send({ adminAccountNum });
});
