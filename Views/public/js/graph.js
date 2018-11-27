var myChart = echarts.init(document.getElementById('line-chart'));

window.WebSocket = window.WebSocket || window.MozWebSocket;
if (!window.WebSocket) {
    console.log('Sorry, but your browser doesn\'t support WebSocket.');
}
// open connection
var connection = new WebSocket('ws://127.0.0.1:8087');
connection.onopen = function () {
    console.log('Connected.');
};
connection.onerror = function (error) {
    console.log('Sorry, but there\'s some problem with your ' +
        'connection or the server is down.');
};
// //Retry after connection lost
// setInterval(function () {
//     if (connection.readyState !== 1) {
//         console.log('Unable to communicate with the WebSocket server.');
//     }
// }, 3000);

connection.onmessage = function (message) {

    var options = JSON.parse(message.data);
    myChart.setOption(options);

    document.getElementById('topUserIp').innerHTML = options.series[1].name;
    document.getElementById('secondTopUserIp').innerHTML = options.series[2].name;
    document.getElementById('thirdTopUserIp').innerHTML = options.series[3].name;

    document.getElementById('topUserSpeed').innerHTML = options.series[1].data[ options.series[1].data.length - 1 ];
    document.getElementById('secondTopUserSpeed').innerHTML = options.series[2].data[ options.series[2].data.length - 1 ];
    document.getElementById('thirdTopUserSpeed').innerHTML = options.series[3].data[ options.series[3].data.length - 1 ];

}
