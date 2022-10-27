const Sequelize = require("sequelize");
//
class Notification extends Sequelize.Model {
  //
  static init(sequelize) {
    //
    return super.init(
      {
        message: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        charset: "utf8",
        timestamps: true,
        underscored: true,
        modelName: "Notification",
        tableName: "notifications",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {
    //
    db.Notification.belongsTo(db.User, { foreignKey: "user_id_fk", targetKey: "id" });
  }
}
module.exports = Notification;
