/**Use this file to export any configuration from the .env file
 * Then, easily import from any file in the project
 */
const dotenv = require('dotenv');
const path = require('path');

const epath = path.join(__dirname, '../.env');
dotenv.config({ path: epath });
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SESSION_TOKEN = process.env.AWS_SESSION_TOKEN;

const configs = {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_SESSION_TOKEN
};

module.exports = configs;
