const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

//Connect to lightbnb database using node-postgres
const pool = new Pool({
  user: 'akshathakulkarni',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  console.log('email=', email)
  const queryString = `SELECT * FROM users WHERE email = $1;`;
  const values = [email];
  return pool
    .query(queryString, values)
    .then((result) => {
      return result.rows[0] || null;
    })
    .catch((err) => {
      console.log(err.message);
      
    });
  // let user;
  // console.log('email=', email)
  // for (const userId in users) {
  //   user = users[userId];
  //   console.log(user.email)
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString = `SELECT * FROM users WHERE id = $1;`;
  const values = [id];
  return pool
    .query(queryString, values)
    .then((result) => {
      console.log('id result =', result.rows[0])
      return result.rows[0] || null; 
    })
    .catch((err) => {
      console.log(err);
    })
  //return Promise.resolve(users[id]);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  //console.log('user data ', user);
  const name = user.name;
  const email = user.email;
  const password = user.password;

  const queryString = `INSERT INTO users(name, email, password) VALUES ($1, $2, $3) returning *;`;
  return pool
    .query(queryString, [name, email, password])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err);
    })
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const queryString = `SELECT * FROM reservations 
  JOIN properties ON reservations.property_id = properties.id
  WHERE reservations.guest_id = $1  
  LIMIT $2;`;
  const id = guest_id;
  console.log('id ', guest_id);
  const lim = limit;
  const values = [id, lim];
  return pool
    .query(queryString, values)
    .then((result) => {
      //console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err);
    })
  //return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  //Querying the database
  const queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  console.log(options);
  if (options.city && options.minimum_rating ) {
    if (options.minimum_price_per_night && options.maximum_price_per_night) {
      queryParams.push(`${options.city}`);
      queryParams.push(`${options.minimum_price_per_night}`);
      queryParams.push(`${options.maximum_price_per_night}`);
      queryParams.push(`${options.minimum_rating}`);
      queryString += `WHERE (city = $${queryParams.length - 3} OR cost_per_night BETWEEN $${queryParams.length - 2} AND $${queryParams.length - 1}) AND property_reviews.rating >= $${queryParams.length}`;
    }
  }
  // if(options.city) {
  //   queryParams.push(`${options.city}`);
  //   queryString += `WHERE city = $${queryParams.length} `;
  // }
  // if(options.minimum_price_per_night && options.maximum_price_per_night) {
  //     queryParams.push(`${options.minimum_price_per_night}`);
  //     queryParams.push(`${options.maximum_price_per_night}`);
  //     queryString += `AND cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length})`;
  // }
  // if (options.minimum_rating) {
  //   queryParams.push(`${options.minimum_rating}`);
  //   queryString += `AND property_reviews.rating >= $${queryParams.length}`;
  // }
  
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE properties.owner_id = $${queryParams.length}`;
  }
  
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
  // console.log('options ', options);
  // const city = options.city;
  // const min_price_per_night = options.minimum_price_per_night;
  // const max_price_per_night = options.maximum_price_per_night;
  // const min_rating = options.minimum_rating;
  // const limit_check = limit;
  // const values = [city, min_price_per_night, max_price_per_night, min_rating, limit_check];

  // return pool
  //   .query(`SELECT * FROM properties LIMIT $1`, [values])
  //   .then((result) => {
  //     //console.log(result.rows);
  //     return result.rows;
  //   })
  //   .catch((err) => {
  //     console.log(err.message);
  //   });

  // const limitedProperties = {};
  // for (let i = 1; i <= limit; i++) {
  //   limitedProperties[i] = properties[i];
  // }
  // return Promise.resolve(limitedProperties);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  // console.log(property);

  // const queryString = `INSERT INTO properties(owner_id, title, description, thumbnail_photo_url, 
  //   cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, 
  //   number_of_bedrooms) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) returning *;`;
  // const values = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, 
  // property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province,
  // property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, 
  // property.number_of_bedrooms];
  
  // return pool
  //  .query(queryString, values)
  //  .then((result) => {
  //    console.log(result.rows);
  //    return result.rows;
  //  })
  //  .catch((err) => {
  //    console.log(err);
  //  })
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
}
exports.addProperty = addProperty;
