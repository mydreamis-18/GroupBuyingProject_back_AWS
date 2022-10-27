const { User, Product, BuyNowTransaction, BuyTogetherTransaction, Notification } = require("../model");
const jwt = require("jsonwebtoken");
//
//////////////////////////////////////
function issueAccessTokenFn(user_id) {
  //
  // ㅜ payload,scretKey,options
  return jwt.sign(
    {
      user_id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1m",
      issuer: "mydreamis-18",
    }
  );
}
//
///////////////////////////////////////
function issueRefreshTokenFn(user_id) {
  //
  return jwt.sign(
    {
      user_id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "5m",
      issuer: "mydreamis-18",
    }
  );
}
//
/////////////////////////////////////
async function getUserDataFn(user_id) {
  //
  let userData = await User.findOne({
    where: { user_id },
    attributes: ["id", "nickname", "points"],
    include: [
      {
        model: BuyNowTransaction,
        attributes: ["is_refund", "created_at", "updated_at"],
        include: [{ model: Product, attributes: ["id", "name", "price"] }],
      },
      {
        model: BuyTogetherTransaction,
        attributes: ["is_refund", "created_at", "updated_at"],
        include: [{ model: Product, attributes: ["id", "name", "price"] }],
      },
      {
        model: Notification,
        attributes: ["message", "created_at"],
      },
    ],
  });
  userData = { ...userData.dataValues };
  userData.Notifications = userData.Notifications.map((el) => el.dataValues);
  userData.BuyNowTransactions = userData.BuyNowTransactions.map((el) => el.dataValues);
  userData.BuyTogetherTransactions = userData.BuyTogetherTransactions.map((el) => el.dataValues);
  userData.BuyNowTransactions = userData.BuyNowTransactions.map((el) => ({ ...el, Product: el.Product.dataValues, type: "바로 구매" }));
  userData.BuyTogetherTransactions = userData.BuyTogetherTransactions.map((el) => ({ ...el, Product: el.Product.dataValues, type: "공동 구매" }));
  return userData;
}
///////////////////////////////////////////////////////
async function verifyTokensMiddleware(req, res, next) {
  //
  console.log("verifyTokensMiddleware", "미들웨어에서는 DB상 회원의 id 값을 다루지 않을 예정");
  //
  const { access_token, refresh_token } = req.body;
  //
  const verifyAccessToken = await verifyTokenFn(access_token, process.env.ACCESS_TOKEN_SECRET);
  if (verifyAccessToken.isValid) {
    //
    if (req.path === "/refreshPage") {
      //
      const user_id = verifyAccessToken.decode.user_id;
      console.log("accessToken", user_id);
      req.user_id = user_id;
    }
    next();
    return;
  }
  const verifyRefreshToken = await verifyTokenFn(refresh_token, process.env.REFRESH_TOKEN_SECRET);
  if (!verifyRefreshToken.isValid) {
    //
    res.send({ isSuccess: false, alertMsg: "다시 로그인해주세요." });
    return;
  }
  const user_id = verifyRefreshToken.decode.user_id;
  console.log("refreshToken", user_id);
  //
  const isSame = await isSameRefreshTokenFn(user_id, refresh_token);
  if (isSame) {
    //
    const newAccessToken = issueAccessTokenFn(user_id);
    req.newAccessToken = newAccessToken;
    //
    // req = { ...req, newAccessToken }; // 안 됨
    //
    if (req.path === "/refreshPage") {
      //
      req.user_id = user_id;
    }
    next();
    return;
  }
  res.send({ isSuccess: false, alertMsg: "다시 로그인해주세요." });
  return;
  //
  // ㅜ then() 함수 사용
  // verifyTokenFn(access_token, process.env.ACCESS_TOKEN_SECRET).then((accessToken) => {
  //   if (accessToken.isValid) {
  //     //
  //     next();
  //     return;
  //   }
  //   User.findOne({ where: { user_id }, attributes: ["refresh_token"] })
  //     .then((obj) => obj.dataValues.refresh_token)
  //     .then((token) => token === refresh_token)
  //     .then((isSame) => {
  //       if (!isSame) {
  //         //
  //         res.send({ isSuccess: false, alertMsg: "다시 로그인해주세요" });
  //         return;
  //       }
  //       verifyTokenFn(refresh_token, process.env.REFRESH_TOKEN_SECRET).then((refreshToken) => {
  //         if (refreshToken.isValid) {
  //           //
  //           const access_token = issueAccessTokenFn(user_id);
  //           req = { ...req, access_token };
  //           next();
  //           return;
  //         }
  //         res.send({ isSuccess: false, alertMsg: "다시 로그인해주세요" });
  //         return;
  //       });
  //     });
  // });
}
//
////////////////////////////////////////////////
async function verifyTokenFn(token, secretKey) {
  // ㅗ promise 객체가 끝날때까지 기다려주는 역할
  //
  return jwt.verify(token, secretKey, (err, decode) => {
    //
    if (err) {
      //
      return { isValid: false };
    }
    //
    else return { isValid: true, decode };
  });
}
//
/////////////////////////////////////////////////////////////
async function isSameRefreshTokenFn(user_id, refresh_token) {
  //
  console.log("isSame", user_id);
  const tokenInDB = await User.findOne({ where: { user_id }, attributes: ["refresh_token"] });
  //
  if (tokenInDB === null) {
    //
    return false;
  }
  return refresh_token === tokenInDB.dataValues.refresh_token;
}
//
/////////////////////////////////////////////////////
async function createNotification(userNum, message) {
  //
  let newNotificationId = await Notification.create({ user_id_fk: userNum, message });
  newNotificationId = newNotificationId.dataValues.id;
  //
  const newNotification = await Notification.findOne({ where: { id: newNotificationId }, attributes: ["message", "created_at"] });
  return newNotification.dataValues;
}
//
///////////////////////////////////////
const fileFilter = async (req, file, cb) => {
  //
  if (req.body.name === undefined) {
    //
    cb(null, true);
    return;
  }
  const { name } = req.body;
  //
  const checkOverlap = await Product.findOne({ where: { name } });
  if (checkOverlap === null) cb(null, true);
  else {
    cb("같은 이름의 상품이 이미 등록되어 있습니다.", false);
  }
};
//
///////////////////////////////////////////////////
async function findTransactionFn(model, id, type) {
  //
  const result = await model.findOne({ where: { id: id }, attributes: ["is_refund", "created_at", "updated_at"], include: [{ model: Product, attributes: ["id", "name", "price"] }] });
  //
  return { ...result.dataValues, Product: { ...result.Product.dataValues, type } };
}
//
////////////////////////////////////////
async function changeToRefundFn(model, userNum, productNum, created_at) {
  //
  return await model.update({ is_refund: true }, { where: { user_id_fk: userNum, product_id_fk: productNum, created_at } });
}
//
module.exports = {
  //
  verifyTokensMiddleware,
  isSameRefreshTokenFn,
  issueRefreshTokenFn,
  issueAccessTokenFn,
  createNotification,
  findTransactionFn,
  changeToRefundFn,
  verifyTokenFn,
  getUserDataFn,
  fileFilter,
};
