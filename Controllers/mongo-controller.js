
var http              = require('http'),
    MongoClient       = require('mongodb').MongoClient,
    mikroNode         = require( 'mikronode' ),
    handleError       = require('errorhandler');


var url               = "mongodb://localhost:27017/";
const sizeRequestsCollection = 100; // Value is in GBs


var databaseObject              ;
var networkDnsLog               ;
var networkUserDetails          ;
var networkUserRequestDetails   ;


var routerSubMaskIp = '192.168.8';
var routerIp        =  routerSubMaskIp + '0.1';
var mikroTipObject  =  new mikroNode( routerIp );


////////////////////////////////////////
////////////////////////////////////////
//@Since 1.0 ///////////////////////////
//Module exports for mongodb interaction
 module.exports.createConnection =  function createConnnectWithMongo( dbName , networkDnsLog_  , networkUserDetails_ , networkUserRequestDetails_  , resolve_callback ){

  MongoClient.connect(url, { useNewUrlParser: true } , function(err, db) {

      if (err) throw err;

      databaseObject = db.db( dbName );
      
      databaseObject.createCollection( networkDnsLog_ , function(err, res) {

        if (err) throw err;
        databaseObject.collection( networkDnsLog_ ).createIndex({  ipAddress:1 });


      });
      databaseObject.createCollection( networkUserDetails_ , function(err, res) {

        if (err) throw err;
        databaseObject.collection( networkUserDetails_ ).createIndex({  ipAddress:1 });

      });
      databaseObject.createCollection( networkUserRequestDetails_ , function(err, res) {

        if (err) throw err;
        databaseObject.collection( networkUserRequestDetails_ ).createIndex({  ipAddress:1 });

      });


      databaseName                      = dbName;
      networkDnsLog                     = networkDnsLog_;
      networkUserDetails                = networkUserDetails_;
      networkUserRequestDetails         = networkUserRequestDetails_;


 

    setInterval(function () {
      databaseObject.collection( networkUserRequestDetails_ ).stats(function(err, results) {

  
          if( results.storageSize > sizeRequestsCollection / sizeRequestsCollection * 1024 * 1024    )// one row contains 70 bytes
          {
              databaseObject.collection( networkUserRequestDetails_ ).find().skip( parseInt(  sizeRequestsCollection * 1024 * 1024   / (results.storageSize / results.count)  )    ).sort( { searchnonce : 1 } ).toArray(function(err, result_b) {
                if( results.length > 0 )
                {
                    console.log( "second doing" );
                    databaseObject.collection( networkUserRequestDetails_ ).removeMany( { searchnonce : { $gt: result_b[0].searchnonce } });
                }
               
              });
          }

      });
      databaseObject.collection( networkDnsLog_ ).stats(function(err, results) {
    
        if( results.storageSize > ( 1 * 1024 * 1024 )  )// one row contains 70 bytes
        {
            databaseObject.collection( networkDnsLog_ ).find().map(function(i) { return i._id; }).skip( parseInt(  25 * 1024 * 1024    / (results.storageSize / results.count)  )    ).sort( { searchnonce : 1 } ).toArray(function(err, result_b) {
              if( result_b )
              {
                  console.log( result_b.length );
                  console.log( "i 'm doing" );
                  console.log( results.storageSize );
                  databaseObject.collection( networkDnsLog_ ).deleteMany({'_id':{'$in':result_b}})
              }
  
            });
        }

      });

    }, 10000  );
    resolve_callback( 'fine' );
  });

}


module.exports.saveDnsDetails =  function saveDnsDetailsModule( dnsDetails  )
{
          databaseObject.createCollection( networkDnsLog , function(err, res) {
            if (err) throw err;
              databaseObject.collection( networkDnsLog ).insertMany( dnsDetails , function(err, res) {
                if (err) throw err;
              });
          });
}
module.exports.getDnsAddress =  function getDnsAddress( ipAddress , resolve ) {

  databaseObject.collection( networkDnsLog ).find( { 'ipAddress' : ipAddress  }   ).toArray(function(err, result) {

      if (err) throw err;
      if( result.length > 0 ){

        resolve( { 'dsnUrl' : result[0].urlLink  } );

      } else {

          databaseObject.collection( networkDnsLog ).find( { 'ipAddress' : ipAddress  }   ).toArray(function(err, result) {

              if( result.length > 0 ){
                resolve( { 'dsnUrl' : result[0].urlLink  } );
              } else {
                resolve( { 'dsnUrl' : ipAddress  } );
              }

          });

      }
  });
}

module.exports.getDnsCollection =  function getDnsCollection(  resolve )
{
    databaseObject.collection( networkDnsLog ).find( ).toArray(function(err, result) {

        if (err) throw err;
        resolve( { 'dsnCollection' : result  } );

    });

}


module.exports.saveUserDetails =  function saveUserDetails( userDetail  ){

    if( userDetail.type  === 'Download' ){

        userEntry = {
          '_id'           : userDetail.ipAddress,
          'ipAddress'     : userDetail.ipAddress ,
          'ipName'        : userDetail.ipName ,
          'totalUpload'   : 0 ,
          'totalDownload' : userDetail.totalSz ,
        } ;

    } else {

        userEntry = {
          '_id'            : userDetail.ipAddress ,
          'ipAddress'      : userDetail.ipAddress ,
          'ipName'         : userDetail.ipName ,
          'totalUpload'    : userDetail.totalSz ,
          'totalDownload'  : 0 ,
        };

    }
    databaseObject.collection( networkUserRequestDetails ).insertMany( [userDetail] , function(err, res) {
      if (err) throw err;
    });

    databaseObject.collection ( networkUserDetails ).findOneAndUpdate(
        { 'ipAddress' : userEntry.ipAddress  }  ,
        { $inc: { "totalUpload": userEntry.totalUpload , "totalDownload" : userEntry.totalDownload } , $set : {  "ipName" : userEntry.ipName  } },
        {
          upsert: true,
        }
    );

}
module.exports.saverequestDetails =  function saverequestDetails( requestDetails  ) {

    databaseObject.collection( networkUserRequestDetails ).insertMany( requestDetails , function(err, res) {
        if (err) throw err;
    });

}
module.exports.getAllUserDetails =  function getAllUserDetails( res ) {

    databaseObject.collection( networkUserDetails ).find({}).limit( 500 ).toArray(function(err, allUserDetails) {

      if (err) throw err;
      res.render("tables", { "listObj": allUserDetails  });
      return allUserDetails;

    });

}

module.exports.getAllUserDetailsToGraph =  function getAllUserDetailsToGraph( res ) {

  databaseObject.collection( networkUserDetails ).find({}).limit( 500 ).toArray(function(err, allUserDetails) {

    if (err) throw err;
    if (allUserDetails.length > 0) {
      res.sendUTF(
        JSON.stringify(allUserDetails));
    }
    return allUserDetails;

  });

}
module.exports.getAllUserRequestDetails =  function getAllUserRequestDetails( ipAddress ,  res ) {

    databaseObject.collection( networkUserRequestDetails ) .aggregate(  [ 
      { $match: { "ipAddress": ipAddress }}, 
      { 
        $group: {
          _id: "$targetIp",
          ipAddress : { $first: '$ipAddress' } ,
          ipName : { $first: '$ipName' } ,
          targetIp : { $first: '$targetIp' } ,
          type : { $first: '$type' } ,
          timestamp : { $first: '$timestamp' } ,
          totalSz: {
            $sum : "$totalSz"
          } ,
          numPackets: {
            $sum : "$numPackets"
          }
        }
      }
    ]).toArray(function( err, allUserRequestDetails ) {
      if (err) throw err;
      res.render("user", { "listObj": allUserRequestDetails } );
      return allUserRequestDetails;

    });

}

module.exports.getAllUserRequestDetailsByIp =  function getAllUserRequestDetailsByIp( ipAddress , timestamp , webSocket ) {
  databaseObject.collection( networkUserRequestDetails ).find( { $and: [ { 'searchnonce' : { $gte: timestamp } } , { 'ipAddress' : ipAddress } ] } ).limit( 500 ).toArray(function( err, result ) {

      if (err) throw err;
      if( result.length > 0 ){


          data = JSON.stringify( { 'Data' : result } );
          webSocket.send(data, function data(err) {
            if (err) handleError(err);
          });

      }
      else{

          data = JSON.stringify( { 'Data' : 'noData' } );
          webSocket.send(data, function data(err) {
            if (err) handleError(err);
          });

      }


  });
}

module.exports.getAllUserDetailsWs =  function getAllUserDetailsWs( webSocket ) {
  databaseObject.collection( networkUserDetails ).find().limit( 500 ).toArray(function( err, result ) {

      if (err) throw err;
      if( result.length > 0 ){
        data = JSON.stringify( { 'Data' : result } );
        webSocket.send( data  ,   function data(  err ) {
          if (  err ) handleError( err  );
        });
      }
      else{
        data = JSON.stringify( { 'Data' : 'noData'  } );
        webSocket.send(   data    , function data (    err   ) {
          if (  err ) handleError(  err );
        });
      }


  });
}
module.exports.removeCollection =  function removeCollection(   ) {

  databaseObject.collection(  networkUserDetails_  ).drop();
  databaseObject.collection( networkUserDetails_ ).find(  {}  ).limit( 10 ).toArray(  function( err , all_coupons ) {
    if (  err ) throw err;
     process.exit();
  });


}
