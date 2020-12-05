// Request and Response objects for Ping interface
module.exports.pingRequestFull = {
  message: 'Hello'
};
module.exports.pingRequestEmpty = {};
module.exports.pingResponseFull = {
  message: 'Hi',
  date: new Date().toISOString()
};
module.exports.pingResponseWrongType = {
  message: 'Hi',
  date: 'WRONG_TYPE'
};
