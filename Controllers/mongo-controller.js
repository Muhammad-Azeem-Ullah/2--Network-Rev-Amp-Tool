var http = require('http'),
  MongoClient = require('mongodb').MongoClient,
  mikroNode = require('mikronode'),
  handleError = require('errorhandler'),
  timestamp   = require(  'time-stamp' );


var url = "mongodb://localhost:27017/";
const sizeRequestsCollection = 100; // Value is in GBs


var databaseObject;
var networkDnsLog;
var networkUserDetails;
var networkUserRequestDetails;


var routerSubMaskIp = '192.168.8';
var routerIp = routerSubMaskIp + '0.1';
var mikroTipObject = new mikroNode(routerIp);

var speedTable = {};
var downloadMap = {};


////////////////////////////////////////
////////////////////////////////////////
//@Since 1.0 ///////////////////////////
//Module exports for mongodb interaction
module.exports.createConnection = function createConnnectWithMongo(dbName, networkDnsLog_, networkUserDetails_, networkUserRequestDetails_, resolve_callback) {

  MongoClient.connect(url, {
    useNewUrlParser: true
  }, function (err, db) {

    if (err) throw err;

    databaseObject = db.db(dbName);

    databaseObject.createCollection(networkDnsLog_, function (err, res) {

      if (err) throw err;
      databaseObject.collection(networkDnsLog_).createIndex({
        ipAddress: 1
      });


    });
    databaseObject.createCollection(networkUserDetails_, function (err, res) {

      if (err) throw err;
      databaseObject.collection(networkUserDetails_).createIndex({
        ipAddress: 1
      });

    });
    databaseObject.createCollection(networkUserRequestDetails_, function (err, res) {

      if (err) throw err;
      databaseObject.collection(networkUserRequestDetails_).createIndex({
        ipAddress: 1
      });

    });


    databaseName = dbName;
    networkDnsLog = networkDnsLog_;
    networkUserDetails = networkUserDetails_;
    networkUserRequestDetails = networkUserRequestDetails_;




    setInterval(function () {
      databaseObject.collection(networkUserRequestDetails_).stats(function (err, results) {


        if (results.storageSize > sizeRequestsCollection / sizeRequestsCollection * 1024 * 1024) // one row contains 70 bytes
        {
          databaseObject.collection(networkUserRequestDetails_).find().skip(parseInt(sizeRequestsCollection * 1024 * 1024 / (results.storageSize / results.count))).sort({
            searchnonce: 1
          }).toArray(function (err, result_b) {
            if (results.length > 0) {
              console.log("second doing");
              databaseObject.collection(networkUserRequestDetails_).removeMany({
                searchnonce: {
                  $gt: result_b[0].searchnonce
                }
              });
            }

          });
        }

      });
      databaseObject.collection(networkDnsLog_).stats(function (err, results) {

        if (results.storageSize > (1 * 1024 * 1024)) // one row contains 70 bytes
        {
          databaseObject.collection(networkDnsLog_).find().map(function (i) {
            return i._id;
          }).skip(parseInt(25 * 1024 * 1024 / (results.storageSize / results.count))).sort({
            searchnonce: 1
          }).toArray(function (err, result_b) {
            if (result_b) {
              console.log(result_b.length);
              console.log("i 'm doing");
              console.log(results.storageSize);
              databaseObject.collection(networkDnsLog_).deleteMany({
                '_id': {
                  '$in': result_b
                }
              })
            }

          });
        }

      });

    }, 10000);



    /////////////////////////////////////////////////////umer graph/////////////////////////////////
    setInterval(function () {
      databaseObject.collection(networkUserDetails).find({}).limit(500).toArray(function (err, allUserDetails) {

        if (err) throw err;
        if (allUserDetails.length > 0) {
          let totalSpeed = 0;
          for (let i = 0; i < allUserDetails.length; i++) {
            //make option array table here
            if (typeof speedTable[allUserDetails[i].ipAddress] != 'undefined') {

              if (speedTable[allUserDetails[i].ipAddress].length == 31) {
                speedTable[allUserDetails[i].ipAddress].shift();
              }

              var time = (+new Date() - downloadMap[allUserDetails[i].ipAddress].timestamp) / 1000;

              speedTable[allUserDetails[i].ipAddress].push(
                (Math.round(((allUserDetails[i].totalDownload - downloadMap[allUserDetails[i].ipAddress].totalDownload) * 8 / (1024 * 1024)) * 1e5) / 1e5) / time);
              downloadMap[allUserDetails[i].ipAddress] = {
                totalDownload: allUserDetails[i].totalDownload,
                timestamp: +new Date()
              };
              totalSpeed += speedTable[allUserDetails[i].ipAddress][speedTable[allUserDetails[i].ipAddress].length - 1];

            } else {

              speedTable[allUserDetails[i].ipAddress] = [];
              speedTable['All Users'] = [];
              speedTable[allUserDetails[i].ipAddress].push(0);
              downloadMap[allUserDetails[i].ipAddress] = {
                totalDownload: allUserDetails[i].totalDownload,
                timestamp: +new Date()
              };

            }
          }
          //allusers
          if (speedTable['All Users'].length == 31) {
            speedTable['All Users'].shift();
          }

          speedTable['All Users'].push(Math.round((totalSpeed) * 1e5) / 1e5);
        }
      });
    }, 1000);
    /////////////////////////////////////////////////////umer graph end///////////////////////////////////





    resolve_callback('fine');
  });

}


module.exports.saveDnsDetails = function saveDnsDetailsModule(dnsDetails) {
  databaseObject.createCollection(networkDnsLog, function (err, res) {
    if (err) throw err;
    databaseObject.collection(networkDnsLog).insertMany(dnsDetails, function (err, res) {
      if (err) throw err;
    });
  });
}
module.exports.getDnsAddress = function getDnsAddress(ipAddress, resolve) {

  databaseObject.collection(networkDnsLog).find({
    'ipAddress': ipAddress
  }).toArray(function (err, result) {

    if (err) throw err;
    if (result.length > 0) {

      resolve({
        'dsnUrl': result[0].urlLink
      });

    } else {

      databaseObject.collection(networkDnsLog).find({
        'ipAddress': ipAddress
      }).toArray(function (err, result) {

        if (result.length > 0) {
          resolve({
            'dsnUrl': result[0].urlLink
          });
        } else {
          resolve({
            'dsnUrl': ipAddress
          });
        }

      });

    }
  });
}

module.exports.getDnsCollection = function getDnsCollection(resolve) {
  databaseObject.collection(networkDnsLog).find().toArray(function (err, result) {

    if (err) throw err;
    resolve({
      'dsnCollection': result
    });

  });

}


module.exports.saveUserDetails = function saveUserDetails(userDetail) {

  if (userDetail.type === 'Download') {

    userEntry = {
      '_id': userDetail.ipAddress,
      'ipAddress': userDetail.ipAddress,
      'ipName': userDetail.ipName,
      'totalUpload': 0,
      'totalDownload': userDetail.totalSz,
    };

  } else {

    userEntry = {
      '_id': userDetail.ipAddress,
      'ipAddress': userDetail.ipAddress,
      'ipName': userDetail.ipName,
      'totalUpload': userDetail.totalSz,
      'totalDownload': 0,
    };

  }
  databaseObject.collection(networkUserRequestDetails).insertMany([userDetail], function (err, res) {
    if (err) throw err;
  });

  databaseObject.collection(networkUserDetails).findOneAndUpdate({
    'ipAddress': userEntry.ipAddress
  }, {
    $inc: {
      "totalUpload": userEntry.totalUpload,
      "totalDownload": userEntry.totalDownload
    },
    $set: {
      "ipName": userEntry.ipName
    }
  }, {
    upsert: true,
  });

}
module.exports.saverequestDetails = function saverequestDetails(requestDetails) {

  databaseObject.collection(networkUserRequestDetails).insertMany(requestDetails, function (err, res) {
    if (err) throw err;
  });

}
module.exports.getAllUserDetails = function getAllUserDetails(res) {

  databaseObject.collection(networkUserDetails).find({}).limit(500).toArray(function (err, allUserDetails) {

    if (err) throw err;
    res.render("tables", {
      "listObj": allUserDetails
    });
    return allUserDetails;

  });

}


function compareArray(a,b) {
  if (a.data[ a.data.length - 1 ] < b.data[ b.data.length - 1 ])
    return 1;
  if (a.data[ a.data.length - 1 ] > b.data[ b.data.length - 1 ])
    return -1;
  return 0;
}


module.exports.getAllUserDetailsToGraph = function getAllUserDetailsToGraph(res) {

  let graphArray = [];

  for (const key in speedTable) {
    graphArray.push({
      name: key,
      type: 'line',
      data: speedTable[key],
      areaStyle: {
        normal: {}
      },
      smooth: true
    });
  }

  graphArray.sort(compareArray);

  res.sendUTF(
    JSON.stringify({
      animation: false,

      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        triggerOn: 'mousemove|click'
      },

      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },

      xAxis: [{
        type: 'category',
        boundaryGap: false,
        data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
      }],

      yAxis: [{
        type: 'value',
        name: 'Speed/Mbps',
        min: 0.1
      }],

      series: graphArray

    })
  );

}



module.exports.getAllUserRequestDetails = function getAllUserRequestDetails(ipAddress, res) {

  databaseObject.collection(networkUserRequestDetails).aggregate([{
      $match: {
        "ipAddress": ipAddress
      }
    },
    {
      $group: {
        _id: "$targetIp",
        ipAddress: {
          $first: '$ipAddress'
        },
        ipName: {
          $first: '$ipName'
        },
        targetIp: {
          $first: '$targetIp'
        },
        type: {
          $first: '$type'
        },
        timestamp: {
          $first: '$timestamp'
        },
        totalSz: {
          $sum: "$totalSz"
        },
        numPackets: {
          $sum: "$numPackets"
        }
      }
    }
  ]).toArray(function (err, allUserRequestDetails) {
    if (err) throw err;
    res.render("user", {
      "listObj": allUserRequestDetails
    });
    return allUserRequestDetails;

  });

}

module.exports.getAllUserRequestDetailsByIp = function getAllUserRequestDetailsByIp(ipAddress, timestamp, webSocket) {
  databaseObject.collection(networkUserRequestDetails).find({
    $and: [{
      'searchnonce': {
        $gte: timestamp
      }
    }, {
      'ipAddress': ipAddress
    }]
  }).limit(500).toArray(function (err, result) {

    if (err) throw err;
    if (result.length > 0) {


      data = JSON.stringify({
        'Data': result
      });
      webSocket.send(data, function data(err) {
        if (err) handleError(err);
      });

    } else {

      data = JSON.stringify({
        'Data': 'noData'
      });
      webSocket.send(data, function data(err) {
        if (err) handleError(err);
      });

    }


  });
}
allUsersSpeed = [];
module.exports.getAllUserDetailsWs =  function getAllUserDetailsWs( webSocket ) {
  databaseObject.collection( networkUserDetails ).find().limit( 500 ).toArray(function( err, result ) {

   

      if (err) throw err;
      if( result.length > 0 ){

        for( var ele = 0 ; ele < result.length ; ele++ ){
        
          if( allUsersSpeed[ result[ ele ].ipAddress ] === undefined ) {
    
            allUsersSpeed[ result[ ele ].ipAddress ] = {  totalDownload : result[ ele ].totalDownload  ,  totalUpload : result[ ele ].totalUpload , timestamp : timestamp( 'YYYYMMDDHHmmss' ) }
    
          } else {
    
            nowTimeStamp =  timestamp( 'YYYYMMDDHHmmss' );
            stampDiff    = nowTimeStamp - allUsersSpeed[ result[ ele ].ipAddress ].timestamp ;
            dspeed       = (  result[ ele ].totalDownload - allUsersSpeed[ result[ ele ].ipAddress ].totalDownload ) / stampDiff ;
            uspeed       = (   result[ ele ].totalUpload - allUsersSpeed[ result[ ele ].ipAddress ].totalUpload ) / stampDiff ;
            result[ ele ].dspeed= dspeed;
            result[ ele ].uspeed = uspeed;
            allUsersSpeed[ result[ ele ].ipAddress ] = {  totalDownload : result[ ele ].totalDownload  ,  totalUpload : result[ ele ].totalUpload , timestamp : timestamp( 'YYYYMMDDHHmmss' ) }
    
          }
    
        };
   
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
module.exports.removeCollection = function removeCollection() {

  databaseObject.collection(networkUserDetails_).drop();
  databaseObject.collection(networkUserDetails_).find({}).limit(10).toArray(function (err, all_coupons) {
    if (err) throw err;
    process.exit();
  });


}