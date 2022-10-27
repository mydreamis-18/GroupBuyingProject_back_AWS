const Sequelize = require("sequelize");
//
class BuyTogetherTransaction extends Sequelize.Model {
  //
  static init(sequelize) {
    //
    return super.init(
      {
        is_refund: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
      },
      {
        sequelize,
        charset: "utf8",
        timestamps: true,
        underscored: true,
        collate: "utf8_general_ci",
        modelName: "BuyTogetherTransaction",
        tableName: "buytogethertransactions",
      }
    );
  }
  static associate(db) {
    //
    db.BuyTogetherTransaction.belongsTo(db.User, { foreignKey: "user_id_fk", targetKey: "id" });
    db.BuyTogetherTransaction.belongsTo(db.Product, { foreignKey: "product_id_fk", targetKey: "id" });
  }
}
module.exports = BuyTogetherTransaction;
