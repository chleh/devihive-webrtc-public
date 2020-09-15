import { sendMessage } from "./modules/messageHandler.js";
import {gotStream, handleRemoteHangup, maybeStart, setIsChannelReady, setIsInitiator, pc, isStarted} from "./modules/session.js";

setIsChannelReady(false);
setIsInitiator(false);

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');
let socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  setIsInitiator(true);
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  setIsChannelReady(true);
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  setIsChannelReady(true);
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);

  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    console.log("try set remote desc: type offer");
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    console.log("try set remote desc: type answer");
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    addCandidate(message);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

function addCandidate(message) {
  let candidate = new RTCIceCandidate({
    sdpMLineIndex: message.label,
    candidate: message.candidate
  });
  pc.addIceCandidate(candidate);
}

////////////////////////////////////////////////////

navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

window.onbeforeunload = function() {
  sendMessage('bye');
};

export function getSocket() {
  return socket;
}
