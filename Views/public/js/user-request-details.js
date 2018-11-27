var ws = new WebSocket( "ws://localhost:8081" );
currentTimeStamp = getDateToTimeStamp();

ws.onopen = function (){
  
    var url = new URL( window.location.href );
    var ip = url.searchParams.get("ip");
    ws.send( JSON.stringify({
        timestamp : currentTimeStamp,
        ipAddress : ip
    }));
    currentTimeStamp = getDateToTimeStamp();
   
   
   setInterval(function(){ 
        var url = new URL( window.location.href );
        var ip = url.searchParams.get("ip");
        ws.send( JSON.stringify({
            timestamp : currentTimeStamp,
            ipAddress : ip
        }));
     }, 1000);
     

  };
  
  ws.onmessage = function ( payload )
  {
  
    dataResult = JSON.parse( payload.data );
      if( dataResult.Data !== 'noData' ){
        var outputHtml = ''; 
        var count = 0;
        dataResult.Data.forEach(function(obj) {

            $('#dataTables-example').DataTable().row.add([
                obj.ipName , obj.ipAddress ,  obj.type ,  obj.targetIp ,  obj.numPackets ,  obj.totalSz * 8/(1024.0 * 1024.0) , obj.timestamp 
              ]).draw();
             });
             $('#dataTables-example').DataTable().draw();
             currentTimeStamp = getDateToTimeStamp();
             

      }
   
     
  }
  ws.onclose = function (){
 //   alert("Disconnected with Coupon Stalls");
  };


function getDateToTimeStamp() {
    var today = new Date();
    var dd = today.getDate();

    var mm = today.getMonth()+1; 
    var yyyy = today.getFullYear();
    if(dd<10) 
    {
        dd='0'+dd;
    } 

    if(mm<10) 
    {
        mm='0'+mm;
    } 
    today               = yyyy + '/' + mm + '/' + dd;
    var d               = new Date(); // for now
    var hours           = d.getHours(); // => 9
    var min             = d.getMinutes(); // =>  30
    var sec             = d.getSeconds();
    if( hours < 10 )
    {
        hours = "0"+ hours;
    } if( min < 10)
    {
        min = "0"+ min;
    } if ( sec < 10 ) {
        sec = "0"+ sec;
    }
    currentTime         =  hours + ":" +  min +":" + sec;
    CurrentTimeStamp    = yyyy+''+mm+''+dd+''+hours+''+min+''+sec ;
    return CurrentTimeStamp;

}

$(document).ready(function () {
    $('#dataTables-example').DataTable({
        responsive: true ,
        "drawCallback": function( settings ) {
          
            numPackets = 0;
            packetsSize = 0;
            var count = 0;
            $('#dataTables-example').DataTable().rows().every( function ( rowIdx, tableLoop, rowLoop ) {
                var data = this.data();
                numPackets += parseFloat( data[4] );
                packetsSize += parseFloat( data[5] );
                count++;
            
            } );
          
            jQuery( "#nopackets" ) .html( numPackets );
            jQuery( "#packSize" ) .html( packetsSize );
        }
    });
});

var numPackets = 0;
var packetsSize = 0;

$.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {
        var min =  Date.parse( $('#date_from').val() );
        var max =  Date.parse( $('#date_to').val() );
        var age =  Date.parse( data[6] )   || 0; // use data for the age column

        if( dataIndex === 0 )
        {
          
            numPackets = 0;
            packetsSize = 0;
        }
        
        if ( ( isNaN( min ) && isNaN( max ) ) ||
             ( isNaN( min ) && age <= max ) ||
             ( min <= age   && isNaN( max ) ) ||
             ( min <= age   && age <= max ) )
        {
          
            numPackets = numPackets + parseFloat( data[4] ) ;
            packetsSize += parseFloat( data[5] ) ;
            jQuery( "#nopackets" ) .html( numPackets );
            jQuery( "#packSize" ) .html( packetsSize );
            return true;
        }
        return false;
    }
);
 
$(document).ready(function() {
    var table = $('#dataTables-example').DataTable();
    // Event listener to the two range filtering inputs to redraw on input
    $('#date_to, #date_from').change( function() {
        table.draw();
    } );
});

    $(document).ready(function () {
        // create DateTimePicker from input HTML element
        $("#date_to").kendoDateTimePicker({
            format: "HH:mm:ss yyyy/MM/dd" ,
            timeFormat: "HH:mm:ss" 
            
        });
        $("#date_from").kendoDateTimePicker({
            format: "HH:mm:ss yyyy/MM/dd" ,
            timeFormat: "HH:mm:ss" 
           
        });
    });





