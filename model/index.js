const db = new Object();
const User = require("./user");
const config = require("../config");
const Product = require("./product");
const Sequelize = require("sequelize");
const Notification = require("./notification");
const BuyNowTransaction = require("./buyNowTransaction");
const BuyTogetherTransaction = require("./buyTogetherTransaction");
//
// ㅜ MySQL 연결 객체 생성
const { database, username, password } = config.dev;
const sequelize = new Sequelize(database, username, password, config.dev);
//
db.BuyTogetherTransaction = BuyTogetherTransaction;
db.BuyNowTransaction = BuyNowTransaction;
db.Notification = Notification;
db.sequelize = sequelize;
db.Product = Product;
db.User = User;
//
BuyTogetherTransaction.init(sequelize);
BuyNowTransaction.init(sequelize);
Notification.init(sequelize);
Product.init(sequelize);
User.init(sequelize);
//
BuyTogetherTransaction.associate(db);
BuyNowTransaction.associate(db);
Notification.associate(db);
Product.associate(db);
User.associate(db);
//
module.exports = {
  //
  BuyTogetherTransaction,
  BuyNowTransaction,
  Notification,
  sequelize,
  Product,
  User,
};
