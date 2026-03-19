const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let players = {};

io.on("connection", socket => {

  players[socket.id] = {x:0,y:0,z:0};

  socket.on("move", data=>{
    players[socket.id]=data;
  });

  socket.on("disconnect", ()=>{
    delete players[socket.id];
  });

  setInterval(()=>{
    socket.emit("players", players);
  },50);

});

http.listen(3000, ()=>{
  console.log("Servidor rodando na porta 3000");
});
