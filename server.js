const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

let players = {};
let chat = [];

// Sistema de gangues, inventário, dinheiro
let gangs = {};
let inventory = {};

io.on("connection", socket => {
  console.log(socket.id + " conectado");

  // Inicializa player
  players[socket.id] = {
    x:0,y:0,z:0,
    money:1000,
    gang:null,
    roupas:{},
    vehicle:null
  };
  inventory[socket.id] = [];

  // Movimento
  socket.on("move", data=>{
    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].z = data.z;
  });

  // Chat
  socket.on("chat", msg=>{
    io.emit("chat",{id:socket.id,msg});
  });

  // Roupa
  socket.on("setClothes", roupas=>{
    players[socket.id].roupas = roupas;
  });

  // Gangue
  socket.on("setGang", gang=>{
    players[socket.id].gang = gang;
  });

  // Inventário
  socket.on("addItem", item=>{
    inventory[socket.id].push(item);
  });

  // Veículo
  socket.on("enterVehicle", vehicle=>{
    players[socket.id].vehicle = vehicle;
  });

  // Disconectar
  socket.on("disconnect", ()=>{
    delete players[socket.id];
    delete inventory[socket.id];
  });

  // Envia estado
  setInterval(()=>{
    io.emit("players", players);
  },50);
});

http.listen(3000, ()=>console.log("Servidor GTA RP rodando na porta 3000"));
