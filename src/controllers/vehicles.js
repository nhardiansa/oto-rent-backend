const {
  baseURL
} = require('../helpers/constant');
const {
  validateId,
  requestMapping
} = require('../helpers/requestHandler');
const {
  returningSuccess,
  returningError,
  pageInfoCreator,
  dataMapping
} = require('../helpers/responseHandler');
const vehiclesModel = require('../models/vehicles');
const categoriesModel = require('../models/categories');
const {
  deleteFile
} = require('../helpers/fileHandler');
const {
  noNullData
} = require('../helpers/validator');

exports.getVehicles = async (req, res) => {
  try {
    const data = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 5,
      search: req.query.search || ''
    };

    const results = await vehiclesModel.getVehicles(data);
    const countResult = await vehiclesModel.countData();

    const pageInfo = pageInfoCreator(countResult[0].rows, `${baseURL}/vehicles?`, data);

    return returningSuccess(res, 200, 'List of vehicles', dataMapping(results), pageInfo);
  } catch (error) {
    console.error(error);
    return returningError(res, 500, 'Failed to get vehicles');
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    if (!validateId(id)) {
      return returningError(res, 404, 'Id not a number');
    }

    const vehicle = await vehiclesModel.getVehicle(id);

    if (vehicle.length < 1) {
      return returningError(res, 404, 'Vehicle not found');
    }

    // change to avaliable
    vehicle.map(el => {
      if (el.booked === null) {
        el.booked = 0;
      }
      return el;
    });

    return returningSuccess(res, 200, 'Success get vehicle', dataMapping(vehicle)[0]);
  } catch (error) {
    console.log(error);
    return returningError(res, 500, "Can't get vehicle");
  }
};

exports.addNewVehicle = async (req, res) => {
  try {
    const rules = {
      name: 'string|required',
      price: 'number|required',
      prepayment: 'boolean|required',
      capacity: 'number|required',
      qty: 'number|required',
      location: 'string|required',
      category_id: 'number|required'
    };
    const data = requestMapping(req.body, rules);

    // check if image is uploaded
    if (!req.file) {
      return returningError(res, 400, 'Vehicle picture must be uploaded');
    }

    // change backslash to slash
    data.image = req.file.path.replace(/\\/g, '/');

    // return returningError(res, 500, 'not yet implemented');

    // check if all data is valid
    const checkData = noNullData(data, rules);

    if (checkData) {
      return returningError(res, 400, checkData, data.image);
    }

    // check if vehicle category exist
    const existingCategory = await categoriesModel.getCategory(data.category_id);

    if (existingCategory.length < 1) {
      return returningError(res, 404, 'Category not found', data.image);
    }

    // check if vehicle name already exist
    const existingVehicle = await vehiclesModel.checkExistVehicle({
      name: data.name
    });

    if (existingVehicle.length > 0) {
      return returningError(res, 400, 'Vehicle name already exist', data.image);
    }

    const results = await vehiclesModel.addNewVehicle(data);
    const vehicle = await vehiclesModel.getVehicle(results.insertId);

    return returningSuccess(res, 201, 'Success add new vehicle', dataMapping(vehicle)[0]);
  } catch (error) {
    console.error(error);
    if (req.file) {
      return returningError(res, 500, 'Failed to add new vehicle', req.file.path);
    } else {
      return returningError(res, 500, 'Failed to add new vehicle');
    }
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    if (!req.file) {
      return returningError(res, 400, 'Vehicle picture must be uploaded');
    }

    const rules = {
      name: 'string|required',
      price: 'number|required',
      prepayment: 'boolean|required',
      capacity: 'number|required',
      qty: 'number|required',
      location: 'string|required',
      category_id: 'number|required'
    };

    const data = requestMapping(req.body, rules);

    const sameVehicle = await vehiclesModel.checkExistVehicle(data);

    const imagePath = !data.image ? req.file.path : '';

    if (sameVehicle.length > 0) {
      return returningError(res, 400, 'Vehicle with inputed already exist', imagePath);
    }

    if (req.file) {
      data.image = req.file.path;
    }

    // validate id
    if (!validateId(id)) {
      return returningError(res, 404, 'Id is not validate', imagePath);
    }

    // check if inputed vehicle data is valid
    const nullData = noNullData(data, rules);

    if (nullData) {
      return returningError(res, 400, nullData, imagePath);
    }

    // check if vehicle category exist
    const existingCategory = await categoriesModel.getCategory(data.category_id);

    if (existingCategory.length < 1) {
      return returningError(res, 404, 'Category not found', imagePath);
    }

    // check if vehicle exist
    const existingVehicle = await vehiclesModel.checkExistVehicle({
      id
    });

    if (existingVehicle.length < 1) {
      return returningError(res, 404, 'Vehicle not found', imagePath);
    } else {
      const existingVehicle = await vehiclesModel.getVehicle(id);
      const existingVehicleImage = existingVehicle[0].image;
      if (data.image) {
        deleteFile(existingVehicleImage);
      }
    }

    const results = await vehiclesModel.updateVehicle(id, data);

    if (results.affectedRows < 1) {
      return returningError(res, 500, 'No data has changed', imagePath);
    }

    const vehicle = await vehiclesModel.getVehicle(id);

    return returningSuccess(res, 200, 'Success update vehicle', dataMapping(vehicle)[0]);
  } catch (error) {
    console.error(error);
    return returningError(res, 500, 'Failed to update vehicle', (req.file ? req.file.path : ''));
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    if (!validateId(id)) {
      return returningError(res, 404, 'Id not a number');
    }

    const existingVehicle = await vehiclesModel.getVehicle(id);

    if (existingVehicle.length < 1) {
      return returningError(res, 404, 'Vehicle not found');
    }

    // delete old image
    if (existingVehicle[0].image) {
      deleteFile(existingVehicle[0].image);
    }

    const results = await vehiclesModel.deleteVehicle(id);

    if (results.affectedRows < 1) {
      return returningError(res, 500, 'No data has changed');
    }

    return returningSuccess(res, 200, 'Success delete vehicle', dataMapping(existingVehicle)[0]);
  } catch (error) {
    console.error(error);
    return returningError(res, 500, 'Failed to delete vehicle');
  }
};

exports.getPopularVehicles = async (req, res) => {
  try {
    const rules = {
      page: 'number',
      limit: 'number',
      name: 'string',
      location: 'string',
      category_id: 'number',
      prepayment: 'boolean',
      sort_price: 'sorter'
    };

    const data = requestMapping(req.query, rules);

    for (const key in data) {
      if (!data[key]) {
        return returningError(res, 400, `Your ${key} must be ${rules[key].split('|').shift()}`);
      }
    }

    const {
      page,
      limit
    } = req.query;

    if (!page) {
      data.page = 1;
    }
    if (!limit) {
      data.limit = 5;
    }

    const results = await vehiclesModel.getPopularVehicles(data);
    const resultCount = await vehiclesModel.countPopularVehicles(data);

    const pageInfo = pageInfoCreator(resultCount[0].rows, `${baseURL}/vehicles/popular?`, data);

    return returningSuccess(res, 200, 'List of popular vehicles', dataMapping(results), pageInfo);
  } catch (error) {
    console.log(error);
    return returningError(res, error, 'Failed to get popular vehicles');
  }
};

exports.getFilterVehicles = async (req, res) => {
  try {
    const rules = {
      vehicle_name: 'string',
      minPrice: 'number',
      maxPrice: 'number',
      category_id: 'number',
      qty: 'boolean',
      prepayment: 'boolean',
      location: 'string',
      sort_price: 'sorter',
      sort_qty: 'sorter',
      sort_capacity: 'sorter',
      created: 'sorter',
      popularity: 'sorter',
      page: 'number',
      limit: 'number'
    };

    const data = requestMapping(req.query, rules);

    for (const key in data) {
      if (!data[key]) {
        return returningError(res, 400, `Your ${key} must be ${rules[key].split('|').shift()}`);
      }
    }

    const {
      page,
      limit
    } = req.query;

    if (!page) {
      data.page = 1;
    }
    if (!limit) {
      data.limit = 5;
    }

    if (data.category_id) {
      const existingCategory = await categoriesModel.getCategory(data.category_id);

      if (existingCategory.length < 1) {
        return returningError(res, 404, 'Category not found');
      }
    }

    const results = await vehiclesModel.getFilterVehicles(data);
    const resultCount = await vehiclesModel.countFilterVehicles(data);

    const pageInfo = pageInfoCreator(resultCount[0].rows, `${baseURL}/vehicles/filter?`, data);

    return returningSuccess(res, 200, 'List of filter vehicles', dataMapping(results), pageInfo);
  } catch (error) {
    console.error(error);
    return returningError(res, 500, 'Failed to get filter vehicles');
  }
};

exports.updateVehiclePartial = async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const rules = {
      name: 'string',
      price: 'number',
      prepayment: 'boolean',
      capacity: 'number',
      qty: 'number',
      location: 'string',
      category_id: 'number'
    };

    const data = requestMapping(req.body, rules);

    if (req.file) {
      data.image = req.file.path;
    }

    const imagePath = data.image ? data.image : '';

    // return returningError(res, 500, 'Not implemented yet');

    if (!validateId(id)) {
      return returningError(res, 400, 'Id not a number');
    }

    if (Object.keys(data).length < 1) {
      return returningError(res, 400, 'Data empty');
    }

    // check if inputed vehicle data is valid
    const nullData = noNullData(data, rules);

    if (nullData) {
      return returningError(res, 400, nullData, imagePath);
    }

    // checking duplicate vehicle name
    if (data.name) {
      const {
        name
      } = data;

      // check duplicate vehicle name
      const duplicateName = await vehiclesModel.checkExistVehicle({
        name
      });

      if (duplicateName.length > 0) {
        return returningError(res, 400, 'Vehicle name already exist', imagePath);
      }
    }

    // check if vehicle exist
    const vehicle = await vehiclesModel.checkExistVehicle({
      id
    });

    if (vehicle.length < 1) {
      return returningError(res, 404, 'Vehicle not found', imagePath);
    } else {
      const existingVehicle = await vehiclesModel.getVehicle(id);
      const existingVehicleImage = existingVehicle[0].image;
      if (data.image) {
        deleteFile(existingVehicleImage);
      }
    }

    const results = await vehiclesModel.updateVehicle(id, data);

    if (results.affectedRows < 1) {
      return returningError(res, 500, 'No data has changed', imagePath);
    }

    const vehicleUpdated = await vehiclesModel.getVehicle(id);

    return returningSuccess(res, 200, 'Success update vehicle', dataMapping(vehicleUpdated)[0]);
    // return returningError(res, 500, 'Not yet implemented');
  } catch (error) {
    console.error(error);
    const imagePath = req.file ? req.file.path : '';
    return returningError(res, 500, 'Failed to update vehicle', imagePath);
  }
};

exports.locationList = async (req, res) => {
  try {
    const results = await vehiclesModel.locationList();

    return returningSuccess(res, 200, 'List of location', results);
  } catch (error) {
    console.error(error);
    return returningError(res, 500, 'Failed to get location list');
  }
};
