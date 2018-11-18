// routes/index.js
const noteRoutes = require('./note_routes');
const noteRoutes2 = require('./userScore');
const noteRoutes3 = require('./friends');
module.exports = function(app, db) {
  noteRoutes(app, db);
  noteRoutes2(app, db);
  noteRoutes3(app, db);
  // Other route groups could go here, in the future
};