const configs = require('../../utils/config');
const aws = require('aws-sdk');

/**
 * Default AWS Configurations
 */
const awsConfig = {
  accessKeyId: configs.AWS_ACCESS_KEY_ID,
  secretAccessKey: configs.AWS_SECRET_ACCESS_KEY,
  sessionToken: configs.AWS_SESSION_TOKEN,
  region: 'us-east-1'
};

/**
 * Update AWS configurations
 * 
 * @param {AWS config key to update} key 
 * @param {Value of AWS config key} value 
 */
function updateAWSConfig(key, value) {
  awsConfig[key] = value;
  aws.config.update(awsConfig);
}

/**
 * Set AWS configuration
 * 
 * @param {new configuration for *ALL* required AWS configs} newConfig 
 */
function setAWSConfig(newConfig) {
  aws.config.update(newConfig);
}

/**
 * Initialize AWS with default configurations from process.env
 */
function initAws() {
  aws.config.update(awsConfig);
}

function getAWSConfig() {
  return awsConfig;
}

const aws_config = {
  initAWS: initAws,
  updateAwsConfig: updateAWSConfig,
  setAWSConfig: setAWSConfig,
  getAWSConfig: getAWSConfig
}

module.exports = aws_config;