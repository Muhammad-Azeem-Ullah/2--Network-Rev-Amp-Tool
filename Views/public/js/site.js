


   var totalUpload = 0;
   var totalDownload = 0;

var ws = new WebSocket( "ws://localhost:8082" );



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
     }, 1000);
     

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
                data[2] = Number( parseFloat( obj.totalUpload ) /(1024.0 * 1024.0) ) ;
                data[3] = Number( parseFloat( obj.totalDownload ) /(1024.0 * 1024.0) );

            }
        
            table.row('.'+obj.ipAddress.split('.').join('_')).data( data )
            });
            table.draw();
    }
}
  setInterval(function(){ 
    var table = $('#dataTables-example').DataTable();
      $( ".ipAddress" ).each(function() {

        ipAddress = $( this ).attr( "id" ).split('.').join('_') ;
        userUspeedObj =  jQuery ( "#"+ipAddress+"_uspeed");
        userUploadObj =  jQuery ( "#"+ipAddress+"_upload");
        userDspeedObj =  jQuery ( "#"+ipAddress+"_dspeed");
        userDownloadObj =  jQuery ( "#"+ipAddress+"_download");

        if( userUspeedObj.attr( 'data-timestamp' ) == undefined )
        {
            userUspeedObj.attr( 'data-timestamp' , getDateToTimeStamp() );
        } else {
            timeDiff =  getDateToTimeStamp() - parseInt( userUspeedObj.attr( 'data-timestamp' ) );
            if( timeDiff > 0 )
            {


                uspeed = ( parseFloat ( userUploadObj.html() ) - parseFloat( userUspeedObj.attr( 'data-upload' ) )  ) / timeDiff;
                totalUpload += ( parseFloat ( userUploadObj.html() ) - parseFloat( userUspeedObj.attr( 'data-upload' ) )  );
                data = table.row('.'+ipAddress).data();
                data[4] = Number( parseFloat( uspeed ) ).toFixed( 5 ) * 8 ;
                table.row('.'+ipAddress).data( data )
                userUspeedObj.attr( "data-upload" ,  userUploadObj.html()   );
                userUspeedObj.attr( 'data-timestamp' , getDateToTimeStamp()  );


            }
        }

        if( userDspeedObj.attr( 'data-timestamp' ) == undefined )
        {
            userDspeedObj.attr( 'data-timestamp' , getDateToTimeStamp() );
        } else {

            timeDiff = parseInt( getDateToTimeStamp() ) - parseInt( userDspeedObj.attr( 'data-timestamp' ) );
            if( timeDiff > 0 )
            {
               
                dspeed = ( parseFloat ( userDownloadObj.html() ) - parseFloat( userDspeedObj.attr( 'data-download' ) )  ) / timeDiff;
                data = table.row('.'+ipAddress).data();
                data[5] = Number( parseFloat( dspeed ) ).toFixed( 5 ) * 8 ;
                table.row('.'+ipAddress).data( data )
                totalDownload += ( parseFloat ( userDownloadObj.html() ) - parseFloat( userDspeedObj.attr( 'data-download' ) )  ) ;
                userDspeedObj.attr( "data-download" ,  userDownloadObj.html()   );
                userDspeedObj.attr( 'data-timestamp' , getDateToTimeStamp() );

            }
        }
      });
        var numbers = table.column( 4 ).data(); // sums to 100
        var sum = 0;
        for (var i = 0; i < numbers.length; i++) {
            sum += parseFloat( numbers[i] );
        }
        if( sum > 0 && sum < 1000 )
        {
            $(".totalUploadId").html(  sum );
        }
   
        var numbers = table.column( 5 ).data(); // sums to 100
        var sum = 0;
        for (var i = 0; i < numbers.length; i++) {
            sum += parseFloat( numbers[i] );
        }
        if( sum > 0 && sum < 1000   )
        {
            $(".totalDownloadId").html(  sum );
        }
      
        table.draw();


 }, 2000);




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




