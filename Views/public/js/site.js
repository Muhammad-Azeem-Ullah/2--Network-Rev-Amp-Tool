var totalUpload = 0;
var totalDownload = 0;


var urlConst = window.location.href.replace(":4000/users", "").replace( "http://" , "" );
var ws = new WebSocket( "ws://"+urlConst+":8085" );


$(document).ready(function () {
    $('#dataTables-example').DataTable({
        responsive: true,
        paging: false ,
        select: true , 
    });
    $('#dataTables-example').DataTable().rows().every( function ( rowIdx, tableLoop, rowLoop ) {
        var data = this.data();
        totalUpload += parseFloat( data[2] );
        totalDownload += parseFloat( data[3] );
    
    } );
    

 
});
$("#tablebody").on('click', 'td', function () {
    let ip = $(event.target).parent('tr').children('.ipAddress').html(); 
    window.location.href = "user?ip=" + ip;
});

$("#tablebody").on('click', '#btnClear', function () {
    alert($(event.target).attr("data-userId"));
    return false;
});

ws.onopen = function (){

   setInterval(function(){ 

        ws.send( JSON.stringify({
            request : 'Request Data' ,
        }));
     }, 1500);
     

  };
  
  ws.onmessage = function ( payload )
  {
    var table = $('#dataTables-example').DataTable();
    dataResult = JSON.parse( payload.data );
      if( dataResult.Data !== 'noData' ){
        var outputHtml = ''; 
        var count = 0;
        dataResult.Data.forEach(function(obj) {


            data = table.row('.'+obj.ipAddress.split('.').join('_')).data();
            if( data != undefined )
            {
                data[2] = Number( parseFloat( obj.totalUpload ) /(1024.0 * 1024.0) ).toFixed( 5 ) ;
                data[3] = Number( parseFloat( obj.totalDownload ) /(1024.0 * 1024.0) ).toFixed( 5 );
                data[4] = Number( parseFloat( obj.uspeed * 8 ) /(1024.0 * 1024.0) ).toFixed( 5 ) ;
                data[5] = Number( parseFloat( obj.dspeed  * 8 ) /(1024.0 * 1024.0 ) ).toFixed( 5 ) ;

            }
        
            table.row('.'+obj.ipAddress.split('.').join('_')).data( data )
            });
            table.draw();
    }
}
  setInterval(function(){ 
    var table = $('#dataTables-example').DataTable();
   
        var numbers = table.column( 4 ).data(); // sums to 100
        var sum = 0;
        for (var i = 0; i < numbers.length; i++) {
            sum += parseFloat( numbers[i] );
        }
        if( sum > 0 && sum < 1000 )
        {
            $(".totalUploadId").html(   Number( parseFloat(  sum ) ).toFixed( 5 )  );
        }
   
        var numbers = table.column( 5 ).data(); // sums to 100
        var sum = 0;
        for (var i = 0; i < numbers.length; i++) {
            sum += parseFloat( numbers[i] );
        }
        if( sum > 0 && sum < 1000   )
        {
            $(".totalDownloadId").html( Number( parseFloat(  sum ) ).toFixed( 5 )   );
        }
      
        table.draw();


 }, 1000);




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
    var msec             = d.getMilliseconds();
    if( hours < 10 )
    {
        hours = "0"+ hours;
    } if( min < 10)
    {
        min = "0"+ min;
    } if ( sec < 10 ) {
        sec = "0"+ sec;
    }
    CurrentTimeStamp    = yyyy+''+mm+''+dd+''+hours+''+min+''+sec ;
    return CurrentTimeStamp;

}   

