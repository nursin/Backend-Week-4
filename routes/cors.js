const cors = require('cors'); // import cors module

// 
const whitelist = ['http://localhost:3000', 'https://localhost:3443'];

// 
const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  console.log(req.header('Origin'));
  // indexOf returns -1 if item not found
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

// returns to us middleware funct configure to set cors header of ACAO on res object with wildcard for its value meaning it will aloow cors for all origins
exports.cors = cors();

// will return middleware funct check if incoming req belongs to one of the whitelist origins
// if does will end back res header ACAO this time with white list origin as value
// and if it doesnt match origins wont send back cors header at all
exports.corsWithOptions = cors(corsOptionsDelegate);