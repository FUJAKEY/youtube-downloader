const Sequelize = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
});

const User = require('./user')(sequelize);
const File = require('./file')(sequelize);

// Relationships
User.hasMany(File, { foreignKey: 'userId' });
File.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    User,
    File
};
