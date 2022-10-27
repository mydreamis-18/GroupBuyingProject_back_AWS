const { verifyTokensMiddleware, fileFilter } = require("../service");
const { Product } = require("../model");
const express = require("express");
const router = express.Router();
//
////////////////////////////////////////////////////////////
// ㅜ 업로드 이미지 파일을 DB에 저장하기 위해 필요한 multer 모듈
const path = require("path");
const multer = require("multer");
const storage = multer.diskStorage({
  //
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../tmp/uploads"));
  },
  filename: function (req, file, cb) {
    // cb(null, file.fieldname + "-" + Date.now()); // 공식 문서
    //
    // ㅜ 한글 포함해서 원래 파일명 그대로 저장하기
    const filename = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, filename);
  },
});
//
///////////////////////////////////////////////
router.post("/getAllProducts", (req, res) => {
  //
  Product.findAll().then((obj) => res.send(obj));
});
//
////////////////////////////////////////////////////////////////////
router.post("/verifyTokens", verifyTokensMiddleware, async (req, res) => {
  //
  const { newAccessToken } = req;
  //
  res.send({ isSuccess: true, newAccessToken });
});
//
////////////////////////////////////////////////
//    10.14.20
// 1. DB에 같은 이름의 데이터가 있는 지 확인한 다음
// 2. 업로드한 이미지 파일을 백엔드 폴더에 저장하고
// 3. 나머지 formData() 객체의 데이터를 DB에 저장
router.post("/addProduct/formData", (req, res) => {
  //
  // console.log(req.file); // formData() 객체를 사용하지 않으면 undefined
  // console.log(req.body.img); // undefined // formData() 객체를 사용하지 않으면 {}
  // console.log(req.body.start_date); // axiois before (object) 값과는 다른 값이군... '2022-10-12T05:35:18.107Z' (string)
  //
  const addProductMulter = multer({ storage, fileFilter }).single("img");
  addProductMulter(req, res, (err) => {
    //
    if (err) {
      //
      res.send({ isSuccess: false, alertMsg: err });
      return;
    }
    Product.create(req.body).then((obj) => {
      //
      res.send({ isSuccess: true, alertMsg: "상품이 등록되었습니다.", newProduct: obj.dataValues });
    });
  });
});
//
////////////////////////////////////////////////////
router.post("/editProduct/formData", async (req, res) => {
  //
  const addProductMulter = multer({ storage, fileFilter }).single("img");
  addProductMulter(req, res, async (err) => {
    //
    if (err) {
      //
      res.send({ isSuccess: false, alertMsg: err });
      return;
    }
    const updateData = { ...req.body };
    const id = req.body.id;
    delete req.body.id;
    //
    await Product.update(updateData, { where: { id } });
    //
    res.send({ isSuccess: true, alertMsg: "상품 수정이 완료 되었습니다.", updateData });
  });
});
//
///////////////////////////////////////////
router.post("/editProduct", async (req, res) => {
  //
  if (req.body.name !== undefined) {
    //
    const isOverlap = await Product.findOne({ where: { name: req.body.name } });
    if (isOverlap !== null) {
      //
      res.send({ isSuccess: false, alertMsg: "같은 이름의 상품이 이미 등록되어 있습니다." });
      return;
    }
  }
  const updateData = { ...req.body };
  const id = req.body.id;
  delete req.body.id;
  //
  Product.update(updateData, { where: { id } }).then(() => {
    //
    res.send({ isSuccess: true, alertMsg: "상품 수정이 완료 되었습니다.", updateData });
  });
});
//
module.exports = router;
