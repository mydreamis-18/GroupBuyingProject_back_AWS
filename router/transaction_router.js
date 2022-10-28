const { verifyTokensMiddleware, findTransactionFn, createNotification, changeToRefundFn } = require("../service");
const { User, BuyNowTransaction, BuyTogetherTransaction } = require("../model");
const express = require("express");
const router = express.Router();
//
//////////////////////////////////////////////////////////////
router.post("/buy", verifyTokensMiddleware, async (req, res) => {
  //
  const { userNum, type, id, name, productPoints, newPoints } = req.body;
  const { newAccessToken } = req;
  let model = null;
  //
  switch (type) {
    //
    case "바로 구매":
      model = BuyNowTransaction;
      break;
    //
    case "공동 구매":
      model = BuyTogetherTransaction;
      break;
    //
    default:
      break;
  }
  const message = `${name} 상품의 ${type}가 완료되었습니다.\n상품 구입으로 ${productPoints} 포인트가 적립되었습니다.`;
  const newNotification = await createNotification(userNum, message);
  await User.update({ newPoints }, { where: { id: userNum } });
  //
  let newTransitionId = await model.create({ user_id_fk: userNum, product_id_fk: id });
  newTransitionId = newTransitionId.dataValues.id;
  //
  const alertMsg = `${type}가 완료되었습니다.`;
  const newTransition = await findTransactionFn(model, newTransitionId, type);
  //
  res.send({ isSuccess: true, alertMsg, newAccessToken, newTransition, newNotification });
});
//
////////////////////////////////////////////////////////////////////
router.post("/refund", verifyTokensMiddleware, async (req, res) => {
  //
  const { userNum, type, productNum, name, created_at, productPoints, newPoints } = req.body;
  const { newAccessToken } = req;
  let model = null;
  //
  if (type === "바로 구매") {
    //
    model = BuyNowTransaction;
  }
  //
  else if (type === "공동 구매") {
    //
    model = BuyTogetherTransaction;
  }
  const message = `${name} 상품의 ${type} 환불이 완료되었습니다.\n환불로 인해 ${productPoints} 포인트가 차감되었습니다.`;
  const newNotification = await createNotification(userNum, message);
  await User.update({ newPoints }, { where: { id: userNum } });
  //
  await changeToRefundFn(model, userNum, productNum, created_at);
  //
  let updated_at = await model.findOne({ where: { user_id_fk: userNum, product_id_fk: productNum, created_at: Date(created_at) } });
  console.log(updated_at);
  updated_at = updated_at.dataValues.updated_at;
  //
  res.send({ isSuccess: true, alertMsg: "환불이 완료되었습니다.", newAccessToken, updated_at, newNotification });
});
//
module.exports = router;
