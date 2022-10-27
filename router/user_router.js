const { issueAccessTokenFn, issueRefreshTokenFn, getUserDataFn, verifyTokensMiddleware } = require("../service");
const { User, Notification } = require("../model");
const SALT = Number(process.env.BCRYPT_SALT);
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
//
////////////////////////////////////////////
router.post("/signUp", async (req, res) => {
  //
  // ㅜ 다양한 동기적 처리 방법
  // bcrypt.hash(password, SALT, (err, data) => {
  //   //
  //   password = data;
  //   User.create({ user_id, password }).then(() => res.send("회원 가입이 완료되었습니다."));
  // });
  //
  let { nickname, user_id, password } = req.body;
  //
  password = await bcrypt.hash(password, SALT);
  //
  const [user, created] = await User.findOrCreate({ where: { user_id }, defaults: { nickname, password } });
  if (created) {
    //
    const user_id_fk = user.dataValues.id;
    await Notification.create({ user_id_fk, message: `${nickname}님, 회원가입을 축하합니다.` });
    //
    res.send({ isSuccess: true, alertMsg: `${nickname}님 회원 가입이 완료되었습니다.\n얼른 로그인 해서 증정된 포인트를 확인해보세요!` });
  }
  //
  else res.send({ isSuccess: false, alertMsg: "해당 ID로 가입한 회원이 있습니다." });
});
//
/////////////////////////////////////
router.post("/login", (req, res) => {
  //
  let { user_id, password } = req.body;
  //
  User.findOne({ where: { user_id }, attributes: ["password"] }).then(async (obj) => {
    //
    if (obj !== null) {
      //
      const _password = obj.dataValues.password;
      //
      const isMatch = await bcrypt.compare(password, _password);
      if (isMatch) {
        //
        const userData = await getUserDataFn(user_id);
        const access_token = issueAccessTokenFn(user_id);
        const refresh_token = issueRefreshTokenFn(user_id);
        //
        await User.update({ refresh_token }, { where: { user_id } });
        //
        res.send({ isSuccess: true, alertMsg: `${userData.nickname}님 로그인 되었습니다.`, access_token, refresh_token, userData });
      }
      //
      else res.send({ isSuccess: false, alertMsg: "비밀번호를 다시 한 번 확인해주세요." });
    }
    //
    else res.send({ isSuccess: false, alertMsg: "존재하지 않는 아이디입니다." });
  });
});
//
//////////////////////////////////////////////////////////////////////////
router.post("/updateMyData", verifyTokensMiddleware, async (req, res) => {
  //
  const { newAccessToken } = req;
  const { userNum, nickname } = req.body;
  //
  await User.update({ nickname }, { where: { id: userNum } });
  //
  res.send({ isSuccess: true, alertMsg: "닉네임 변경이 완료되었습니다.", newAccessToken });
});
//
////////////////////////////////////////////////////////////////////
router.post("/refreshPage", verifyTokensMiddleware, async (req, res) => {
  //
  const { user_id, newAccessToken } = req;
  console.log("refreshPage", user_id);
  //
  const userData = await getUserDataFn(user_id);
  //
  res.send({ isSuccess: true, newAccessToken, userData });
});
//
module.exports = router;
