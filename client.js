const socket = io();

// ================= CENA =================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luz
const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(10,20,10);
scene.add(light);

// Chão
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400,400),
  new THREE.MeshStandardMaterial({color:0x222222})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// ================= PLAYER =================
let player, mixer, actions = {}, currentAction;
let clock = new THREE.Clock();

// Loader GLTF
const loader = new THREE.GLTFLoader();
loader.load("assets/player.glb", gltf=>{
  player = gltf.scene;
  scene.add(player);
  mixer = new THREE.AnimationMixer(player);
  gltf.animations.forEach(anim=>{
    actions[anim.name] = mixer.clipAction(anim);
  });
  currentAction = actions["Idle"];
  currentAction.play();
});

// ================= CONTROLES =================
let keys = {};
document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);

// ================= MOVIMENTO + ANIMAÇÃO =================
function updatePlayer(){
  if(!player) return;

  let moving=false;
  if(keys["w"]){player.position.z-=0.2;moving=true;player.rotation.y=0;}
  if(keys["s"]){player.position.z+=0.2;moving=true;player.rotation.y=Math.PI;}
  if(keys["a"]){player.position.x-=0.2;moving=true;player.rotation.y=Math.PI/2;}
  if(keys["d"]){player.position.x+=0.2;moving=true;player.rotation.y=-Math.PI/2;}

  // trocar animação
  if(moving) switchAnim("Walk");
  else switchAnim("Idle");

  // enviar posição
  socket.emit("move",{x:player.position.x,y:player.position.y,z:player.position.z});
}

function switchAnim(name){
  if(!actions[name] || currentAction === actions[name]) return;
  currentAction.fadeOut(0.2);
  currentAction = actions[name];
  currentAction.reset().fadeIn(0.2).play();
}

// ================= CHAT =================
const chatInput = document.getElementById("chatInput");
chatInput.addEventListener("keydown",e=>{
  if(e.key==="Enter"){
    socket.emit("chat", chatInput.value);
    chatInput.value="";
  }
});

socket.on("chat", msg=>{
  const div = document.getElementById("messages");
  div.innerHTML += `<br>${msg.id}: ${msg.msg}`;
  div.scrollTop = div.scrollHeight;
});

// ================= OUTROS PLAYERS =================
let others = {};
socket.on("players", data=>{
  for(let id in data){
    if(id===socket.id) continue;
    if(!others[id]){
      let p = new THREE.Mesh(
        new THREE.BoxGeometry(1,2,1),
        new THREE.MeshStandardMaterial({color:0xffffff})
      );
      scene.add(p);
      others[id] = p;
    }
    others[id].position.set(data[id].x,data[id].y,data[id].z);
  }
});

// ================= CÂMERA =================
function updateCamera(){
  if(!player) return;
  const offset = new THREE.Vector3(0,5,10);
  offset.applyAxisAngle(new THREE.Vector3(0,1,0),player.rotation.y);
  const desired = player.position.clone().add(offset);
  camera.position.lerp(desired,0.1);
  camera.lookAt(player.position);
}

// ================= LOOP =================
function animate(){
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if(mixer) mixer.update(delta);
  updatePlayer();
  updateCamera();
  renderer.render(scene,camera);
}
animate();

// ================= RESIZE =================
window.addEventListener("resize",()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
