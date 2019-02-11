const express = require('express');

const app = express();
const http = require('http').Server(app);
const sio = require('socket.io')(http);
const rstr = require('randomstring');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static('static'));

sio.on('connection', function(socket){

  console.log(`User ${socket.id} connected`);

  socket.on('disconnect', function(){
    console.log(`User ${socket.id} disconnected`);
    if(socket.nickname != null) {
        console.log(`LEAVE ${socket.nickname} (to: room ${socket.roomSecret})`);
        socket.to(socket.roomSecret).emit('leave', socket.nickname);
    }
  });

  socket.on('host create session', function(_){
    let sess = rstr.generate({
        length: 4,
        charset: 'alphanumeric'
    });
    socket.emit('session created', sess);

    console.log(`Bridging socket ${socket.id} to room "${sess}"`);
    socket.nickname = "<<HOST>>";
    socket.join(sess);
  });

  socket.on('client connect to', function(params) {
    console.log(`client connect to ${params}`);
    let prm = JSON.parse(params);
    socket.join(prm['room']);
    socket.roomSecret = prm['room'];
    socket.nickname = prm['name'];
    console.log('client ' + socket.id + ' connected to ' + prm['room']);
    socket.to(prm['room']).emit('join', socket.nickname);
    console.log(`JOIN ${socket.nickname} (to: room ${prm['room']}) `);
    socket.emit('people', clientsOfRoom(prm['room']).map((s) => userProps(s)));
  });

  socket.on('orient', function(params) {
      let prm = JSON.parse(params);
      socket.to(socket.roomSecret).emit(
          'update speeds',
          JSON.stringify({'player': socket.nickname, "x": prm["x"] / 3, "y": (prm["y"] - 12) / 3})
      );
  });

});

function clientsOfRoom(roomId) {
    let res = [], room = sio.sockets.adapter.rooms[roomId];
    if (room) {
        for (let id of Object.keys(room.sockets)) {
          if(sio.sockets.adapter.nsp.connected[id] != null) {
            res.push({'id': id, 'socket': sio.sockets.adapter.nsp.connected[id]});
          }
        }
    }
    return res;
}

function userProps(cl) {
  return {'id': cl.id, 'nickname': cl.socket.nickname}
}

http.listen(80, function(){
  console.log('listening on *:80');
});