var Resizer = require('./lib/server');
var Cluster = require('cluster2');

var PORT = process.env.PORT || 8081;
var CLUSTER_MODE = process.env.NODE_ENV === 'production';

var server = Resizer.createServer();
var c = new Cluster({
  port: PORT,
  cluster: CLUSTER_MODE
});

c.listen(function(cb){
  cb(server);
});

console.log('listening on port',PORT);
if(CLUSTER_MODE) console.log('running as a cluster');

