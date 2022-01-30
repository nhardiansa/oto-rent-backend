const db = require('../helpers/db');
const vehiclesTable = 'vehicles';

module.exports = {
  getVehicles: (keys, cb) => {
    db.query(`SELECT ?? FROM ${vehiclesTable}`, [keys], (err, results) => {
      if (err) throw err;
      cb(results);
    });
  },

  getVehicle: (id, cb) => {
    db.query(`
    SELECT * FROM ${vehiclesTable} WHERE id = ?
    `, [id], (err, results) => {
      if (err) throw err;
      cb(results);
    });
  },

  checkExistVehicle: (data, cb) => {
    // make custom query depends keys of object
    let dataInArr = Object.keys(data);
    dataInArr = dataInArr.map((el) => {
      return `${el} = ?`;
    });
    const customQuery = dataInArr.join(' && ');

    // get values of data
    const dataValues = Object.values(data);
    const columns = Object.keys(data);

    db.query(`
    SELECT ?? FROM ${vehiclesTable} WHERE ${customQuery}
    `, [columns, ...dataValues], (err, results) => {
      if (err) throw err;
      cb(results);
    });
  },

  insertVehicle: (data, cb) => {
    db.query(`INSERT INTO ${vehiclesTable} SET ?`, data, (err, results) => {
      if (err) throw err;
      cb(results);
    });
  },

  updateVehicle: (id, data, cb) => {
    db.query(`
    UPDATE ${vehiclesTable} SET ? WHERE id = ?
    `, [data, id], (err, results) => {
      if (err) throw err;
      cb(results);
    });
  },

  deleteVehicle: (id, cb) => {
    db.query(`
    DELETE FROM ${vehiclesTable} WHERE id = ?
    `, [id], (err, results) => {
      if (err) throw err;
      cb(results);
    });
  },
};