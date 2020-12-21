const { exec } = require('child_process');
const recommendationsModel = require('../models/recommendations');

// Get news recommendations
function get_recommendations(req, res) {
  const username = req.query.username ? req.query.username : req.user.username;
  recommendationsModel.getRecommendations(username, (err, data) => {
    if (err) {
      res.json({ recs: [] });
    } else {
      if (data) res.json({ recs: data });
      else res.json({ recs: [] });
    }
  });
}

// updateRecommendations table
function update_recommendations(req, res, callback) {
  if (res) res.send(true);
  command = 'cd ../spark && mvn exec:java@livy';
  exec(command, (err, stdout, stderr) => {
    if (err) console.log(`err: ${err}`);
    if (stderr) console.log(`stderr: ${stderr}`);
    console.log(`stdout: ${stdout}`);
    if (!err && !stderr) callback(true);
    else callback(false);
  });
}

module.exports = {
  get_recommendations,
  update_recommendations
};
