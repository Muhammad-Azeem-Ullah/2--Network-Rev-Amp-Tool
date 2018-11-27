var ipCgiRequest    = require('request'),
    fileServer      = require('fs'),
    path            = require('path'),
    lodash          = require('lodash'),
    timestamp       = require('time-stamp');


var controllerMongo ;
var requestsDetails



var ipCgiRequestUrl = 'http://192.168.80.1/accounting/ip.cgi';
var routerSubMaskIp = '192.168.8';
var ipDetails       = [];
var dnsCollection   = [];

filePath = path.join(__dirname, '../Models/read.txt');


////////////////////////////////////////
////////////////////////////////////////
//@Since 1.0 ///////////////////////////
// @Since 1.0
// Loading ipDetails for system

module.exports.requestControllerMain = function requestControllerMain( controllerMongo_ ) {

    controllerMongo = controllerMongo_;
    const ipDetailsPromise = new Promise( function ( resolve , reject ){
        try{

            fileServer.readFile( filePath,  { encoding: 'utf-8' } , function(err, result) {
                result = result.split( "\n" );
                result.forEach( function    ( element ) {
                    element = element.split( "-" );
                    ipDetails.push( { 'ipAddress' : element[0] , 'ipName' : element[1] } )
                  });
              });
            resolve( 'fine' );
            
        }   catch(  ex  )   {

            reject('error');

        }
      });
      ipDetailsPromise
        .then( function whenOk( response ) {

            ipCgiRequestFunction();

        })
        .catch(function notOk(err) {

            console.error(err)

          });
}

////////////////////////////////////////
////////////////////////////////////////
//@Since 1.0 ///////////////////////////
// Getting data of requests transmission to internet

function ipCgiRequestFunction(){

    setInterval(function(){

        ipCgiRequest({

            url : ipCgiRequestUrl,
            json : true

        }, function ( error , response , result ) {

            if ( !error && response.statusCode === 200 && result !== undefined ) {
                // Spliting data for per requests
                result                    =  result.split( ' * *\n' );
                requestsDetails = result;
                generateRequestData( result );
            }

        });
    } , 2000 );

    setInterval(function(){
        const getDns = new Promise( function ( resolve , reject ){
            try{

                controllerMongo.getDnsCollection( resolve   );

            } catch( ex ){

                reject('error');
            }
        });
        getDns
            .then( function whenOk( response ) {
                dnsCollection =  response.dsnCollection;

            })
            .catch(function notOk(err) {
                console.error(err)
            });
    } , 10000 );
      
  
}


////////////////////////////////////////
////////////////////////////////////////
//@Since 1.0 ///////////////////////////
// Generating Request Details object for DB
function generateRequestData( requestsDetails   ){

   var item = requestsDetails.shift();
    if( item ){

        item = item.split(' ');
        dnsIpAddress = item[0];
        if(     item[0].indexOf( routerSubMaskIp ) !== -1  ){
            dnsIpAddress = item[1];
        }

        var requestObject;
        //download
        if( item[0].indexOf( routerSubMaskIp ) === -1 ){

            var ipSearch = lodash.filter( ipDetails , { 'ipAddress': item[1]  } );
            if( ipSearch[0] ){
                requestObject = { ipAddress : item[1] , ipName : ipSearch[0].ipName , targetIp :  item[0]  , numPackets : parseInt (  item[3] ) , totalSz : parseInt ( item[2] ) , type : "Download" , timestamp : timestamp('HH:mm:ss YYYY/MM/DD') , searchnonce : timestamp( 'YYYYMMDDHHmmss' ) };
            } else{
                requestObject = { ipAddress : item[1] , ipName : 'Unknown' , targetIp :  item[0]  , numPackets : parseInt (  item[3] ), totalSz : parseInt ( item[2] ) , type : "Download" , timestamp : timestamp('HH:mm:ss YYYY/MM/DD') , searchnonce : timestamp( 'YYYYMMDDHHmmss' ) }
            }
        } else {

            var ipSearch = lodash.filter( ipDetails , { 'ipAddress': item[0]  } );
            if( ipSearch[0] ){
                requestObject = { ipAddress : item[0] , ipName : ipSearch[0].ipName , targetIp :  item[1] , numPackets : parseInt (  item[3] ) , totalSz : parseInt ( item[2] ) , type : "Uplaod"  , timestamp : timestamp('HH:mm:ss YYYY/MM/DD') , searchnonce : timestamp( 'YYYYMMDDHHmmss' )};
            } else{
                requestObject = { ipAddress : item[0] , ipName : 'Unknown' , targetIp : item[1]  , numPackets : parseInt (  item[3] ) , totalSz : parseInt ( item[2] ) , type : "Upload"  , timestamp : timestamp('HH:mm:ss YYYY/MM/DD') , searchnonce : timestamp( 'YYYYMMDDHHmmss' ) }
            }
        }

            dnsName = lodash.filter( dnsCollection , { 'ipAddress': requestObject.targetIp  } );
            if( dnsName[0] ){

                requestObject.targetIp = dnsName[0].urlLink;
            }

            setTimeout(function() { controllerMongo.saveUserDetails( requestObject   ); }, 0 );
            setTimeout(function() {    generateRequestData( requestsDetails  ); }, 0 );


    }

  }
