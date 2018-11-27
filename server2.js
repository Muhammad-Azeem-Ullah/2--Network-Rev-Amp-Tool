

var mikroNode            = require( 'mikronode' ),
    controllerMongo      = require( './Controllers/mongo-controller.js' ),
    url                  = require('url'),
    express              = require('express'),
    http                 = require('http'),
    path                 = require('path'),
    WebSocket            = require('ws');

  

const wss                     = new WebSocket.Server({ port: 8086 });
const wssForUsers             = new WebSocket.Server({ port: 8085 });
    

var routerSubMaskIp = '192.168.8';
var routerIp        =  routerSubMaskIp + '0.1';
var mikroTipObject  =  new mikroNode( routerIp );



const databaseName                = 'caramelNetworkDb';
const networkDnsLog               = 'networkDnsLog';
const networkUserDetails          = 'networkUserDetails';
const networkUserRequestDetails   = 'networkUserRequestDetails';

var app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'Views/public')));
var server = http.createServer(app);


const databasePromise = new Promise( function ( resolve , reject )  {
  try {

    controllerMongo.createConnection( databaseName , networkDnsLog , networkUserDetails , networkUserRequestDetails  ,resolve );
  
  } catch( ex ){

    reject('error');

  }
});
databasePromise
  .then( function whenOk  ( response ) {

     


      app.get(  '/', function (req, res) {

        res.render( "index", {
            "listObj": []
        } );

      } );

      app.get(  '/index', function (req, res) {

        res.render( "index", {
            "listObj": []
        } );

      } );

      app.get(  '/users', function (req, res) {

        controllerMongo.getAllUserDetails( res );

      } );

      app.get(  '/user', function (req, res) {

        controllerMongo.getAllUserRequestDetails( req.query.ip , res );
        
      });

      app.listen(4000);
    })
  .catch( function notOk( err ) {

    console.error(err)

  });



  wss.on( 'connection', ws => {

    ws.on(  'message', message => {

      var msgObj = JSON.parse( message );
      controllerMongo.getAllUserRequestDetailsByIp( msgObj.ipAddress , msgObj.timestamp , ws  );

    } );

  } );



  wssForUsers.on( 'connection', ws => {
 
    ws.on(  'message', message => {

      var msgObj = JSON.parse( message );
      controllerMongo.getAllUserDetailsWs( ws);

    } ) ;

  } );


