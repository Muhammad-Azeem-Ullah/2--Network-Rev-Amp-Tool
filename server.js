

var mikroNode            = require( 'mikronode' ),
    requestController    = require( './Controllers/request-controller.js' ),
    controllerMongo      = require( './Controllers/mongo-controller.js' ),
    url                  = require('url'),
    express              = require('express'),
    http                 = require('http'),
    path                 = require('path'),
    WebSocket            = require('ws');
//    app                  = require('./app.js');



const wss                     = new WebSocket.Server({ port: 8081 });
const wssForUsers             = new WebSocket.Server({ port: 8082 });


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

      mikroConnection();
      setInterval(function () {

          mikroConnection( "inLoop" );

        }, 5000  );


    })
  .catch( function notOk( err ) {

    console.error(err)

  });







////////////////////////////////////////
////////////////////////////////////////
//@Since 1.0 ///////////////////////////
// Connecting to the mikroTik router live and performing
function mikroConnection(  times = null ) {


  mikroTipObject.connect()
    .then(  ( [login] ) =>  {

      return login( 'admin' , '<<"Ctch@PHase5DHA">>' );

    })
    .then(function( mtConnection ) {

        var channelDnsDetails    =   mtConnection.openChannel( "getDns" );
        channelDnsDetails.write( '/ip/dns/cache/getall' );
        channelDnsDetails.on( 'trap' , function( data ){
            console.log( data );
            console.log( 'DNS request failed' );
        } );
        channelDnsDetails.on( 'done' , function( result ){
            var dnsDetails        = result.data;
            var dnsdetailsList    =  [];
            if( times == null ){

              generateDns( dnsDetails , dnsdetailsList  , callbackGenerateDns = function( dnsDetails , dnsdetailsList ){
                setTimeout( function() { generateDns( dnsDetails , dnsdetailsList , callbackGenerateDns ) } , 0 );
              });

            } else {

              generateDnsInLoop( dnsDetails , dnsdetailsList  , callbackGenerateDns = function( dnsDetails , dnsdetailsList ){
                setTimeout( function() { generateDnsInLoop( dnsDetails , dnsdetailsList , callbackGenerateDns ) } , 0 );
            });

            }
            channelDnsDetails.close();
            mtConnection.close();
        });
    });
  }

  function generateDns( dnsDetails , dnsdetailsList , callbackGenerateDns  ){

    item = dnsDetails.shift();
    if( item ){
      dnsdetailsList.push( { 'ipAddress' : item[2].value , 'urlLink' : item[1].value  } );
      callbackGenerateDns( dnsDetails , dnsdetailsList );
    }
    else{
      controllerMongo.saveDnsDetails( dnsdetailsList );
      requestController.requestControllerMain( controllerMongo  );

    }
  }

  function generateDnsInLoop( dnsDetails , dnsdetailsList , callbackGenerateDns  ){

    item = dnsDetails.shift();
    if( item ){
      dnsdetailsList.push( { 'ipAddress' : item[2].value , 'urlLink' : item[1].value  } );
      callbackGenerateDns( dnsDetails , dnsdetailsList );
    }
    else{
      controllerMongo.saveDnsDetails( dnsdetailsList );

    }
  }



