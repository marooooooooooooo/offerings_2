const video = document.getElementById('video');
const screensaverAudio = document.getElementById('screensaver-audio');
const clickSound = document.getElementById('click-sound');
const claimButton = document.getElementById('claim-button');
const claimAudio = document.getElementById('claim-audio');
const coins = document.querySelectorAll('.coin');
const chooseText = document.querySelector('.choose-text');
const myClientId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);

const startscreen = document.getElementById('startscreen');
const startButton = document.getElementById('start-button');
const mainContent = document.getElementById('main-content');
const intermediatePage = document.getElementById('intermediate-page');
const intermediateVideo = document.getElementById('intermediate-video');
const inputPage = document.getElementById('input-page');
const submitProphecyButton = document.getElementById('submit-prophecy');
const backgroundVideo = document.getElementById('background-video');

let prophecyAudio = null;
let isCurrentProphecySender = false;
let prophecySenderId = null;

const ws = new WebSocket('wss://blessed-socket-server-f08da3206592.herokuapp.com:443');

ws.onopen = () => {
  console.log('WebSocket verbunden!');
};
ws.onerror = (err) => {
  console.error('WebSocket Fehler:', err);
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('Empfangen:', data, 'Mein ClientId:', myClientId);

    if (data.type === 'prophecy') {
      const display = document.getElementById('display');
      if (display) display.innerText = data.payload;
    }

    if (data.type === 'coin') {
      isCurrentProphecySender = (data.sender === myClientId);
      prophecySenderId = data.sender;

      if (prophecyAudio) {
        prophecyAudio.pause();
        prophecyAudio.currentTime = 0;
      }

      coins.forEach(c => {
        if (c.getAttribute('data-button') !== data.coin) c.style.visibility = 'hidden';
        else c.style.visibility = 'visible';
      });

      if (!data.video) return;
      const delay = data.startTime - Date.now();
      setTimeout(() => {
        video.src = data.video;
        video.loop = false;
        video.muted = true;
        video.style.display = 'block';
        video.load();
        video.play().catch(e => console.warn('Prophezeiungsvideo konnte nicht abgespielt werden:', e));
        chooseText.textContent = `Prophecy for coin ${data.coin}`;

        if (data.video.includes('videoA1.mp4')) {
          prophecyAudio = new Audio('assets/begleit_ton_videoA1.mp3');
          prophecyAudio.currentTime = 0;
          prophecyAudio.play().catch(e => console.warn('Begleit-Ton konnte nicht abgespielt werden:', e));
        } else {
          prophecyAudio = null;
        }
      }, Math.max(0, delay));
    }

    if (data.type === 'claim') {
      claimButton.style.display = 'none';
      claimAudio.pause();
      claimAudio.currentTime = 0;
      if (prophecyAudio) {
        prophecyAudio.pause();
        prophecyAudio.currentTime = 0;
      }
      startScreensaver();
    }

    if (data.type === 'screensaver_start') {
      video.currentTime = 0;
      video.play();
    }

    if (data.type === 'show_claim' && myClientId === data.prophecySender) {
      claimButton.style.display = 'block';
      claimAudio.currentTime = 0;
      claimAudio.loop = true;
      claimAudio.play().catch(e => console.warn('Claim-Audio konnte nicht abgespielt werden:', e));
      chooseText.textContent = 'If you accept the prophecy, touch the word below to seal it.';
      coins.forEach(coin => coin.style.visibility = 'hidden');
    }
  } catch (e) {
    // Ignoriere Nicht-JSON Nachrichten
  }
};

function startScreensaver() {
  video.src = 'assets/screensaver.mp4';
  video.loop = true;
  video.muted = true;
  video.style.display = 'block';
  video.load();
  video.play().catch(e => console.warn('Screensaver-Video konnte nicht abgespielt werden:', e));
  screensaverAudio.currentTime = 0;
  screensaverAudio.play().catch(e => console.warn('Screensaver-Audio konnte nicht abgespielt werden:', e));
  claimButton.style.display = 'none';

  coins.forEach(coin => coin.style.visibility = 'visible');
  ws.send(JSON.stringify({ type: 'screensaver_start', timestamp: Date.now() }));
}

startButton.addEventListener('click', () => {
  console.log('Start button clicked'); // Debug log
  startscreen.classList.add('hidden');
  intermediatePage.classList.remove('hidden');
  intermediateVideo.classList.remove('hidden');
  intermediateVideo.src = "https://www.dropbox.com/scl/fi/1ssoiwou4pft4t22ar3v8/ipad_2.mp4?rlkey=s2z8mhnof8j1r9c8ew3hzyugy&st=vaza6y7o&dl=1";
  intermediateVideo.currentTime = 0;
  intermediateVideo.muted = true;
  intermediateVideo.play().catch(e => console.warn('Intermediate video playback failed:', e));
});

intermediateVideo.addEventListener('ended', () => {
  intermediatePage.classList.add('hidden');
  mainContent.classList.remove('hidden');
  backgroundVideo.play().catch(e => console.warn('Background video playback failed:', e));
});

coins.forEach(coin => {
  coin.addEventListener('click', (event) => {
    console.log('Coin clicked:', event.target.dataset.button);
    screensaverAudio.pause();
    screensaverAudio.currentTime = 0;

    coins.forEach(c => {
      if (c !== event.target) c.style.visibility = 'hidden';
    });

    const buttonType = event.target.dataset.button;
    const videos = {
      A: ['assets/videoA1.mp4', 'assets/videoA2.mp4', 'assets/videoA3.mp4'],
      B: ['assets/videoB1.mp4', 'assets/videoB2.mp4', 'assets/videoB3.mp4'],
      C: ['assets/videoC1.mp4', 'assets/videoC2.mp4', 'assets/videoC3.mp4']
    };
    const selectedVideos = videos[buttonType];
    if (!selectedVideos) return;
    const randomVideo = selectedVideos[Math.floor(Math.random() * selectedVideos.length)];

    window.selectedCoin = buttonType;
    window.selectedVideo = randomVideo;

    mainContent.classList.add('hidden');
    inputPage.classList.remove('hidden');
    inputPage.classList.remove('hidden-flicker');

    const prophecyInput = document.getElementById('prophecy-input');
    prophecyInput.value = '';
    prophecyInput.focus();
  });
});

submitProphecyButton.addEventListener('click', () => {
  const prophecyInput = document.getElementById('prophecy-input');
  const inputValue = prophecyInput.value.trim();

  if (inputValue.length === 0) {
    alert('Please enter your prophecy before proceeding.');
    prophecyInput.focus();
    return;
  }

  inputPage.classList.add('hidden');
  mainContent.classList.remove('hidden');

  coins.forEach(c => {
    if (c.getAttribute('data-button') !== window.selectedCoin) {
      c.style.visibility = 'hidden';
    } else {
      c.style.visibility = 'visible';
    }
  });

  const startTime = Date.now() + 1000;
  ws.send(JSON.stringify({
    type: 'coin',
    coin: window.selectedCoin,
    video: window.selectedVideo,
    startTime,
    sender: myClientId
  }));

  ws.send(JSON.stringify({
    type: 'prophecy',
    payload: inputValue,
    sender: myClientId
  }));
});

video.addEventListener('ended', () => {
  if (prophecySenderId) {
    ws.send(JSON.stringify({ type: 'show_claim', sender: myClientId, prophecySender: prophecySenderId }));
  }
  if (myClientId !== prophecySenderId) {
    startScreensaver();
  }
  if (prophecyAudio) {
    prophecyAudio.pause();
    prophecyAudio.currentTime = 0;
  }
});

claimButton.addEventListener('click', () => {
  console.log('Claim button clicked: resetting UI to start screen');
  claimButton.style.display = 'none';
  claimAudio.pause();
  claimAudio.currentTime = 0;
  if (prophecyAudio) {
    prophecyAudio.pause();
    prophecyAudio.currentTime = 0;
  }
  ws.send(JSON.stringify({ type: 'claim' }));

  mainContent.classList.add('hidden');
  intermediatePage.classList.add('hidden');
  if (inputPage) {
    inputPage.classList.add('hidden');
  }
  startscreen.classList.remove('hidden');

  const startscreenVideo = document.getElementById('startscreen-video');
  if (startscreenVideo) {
    startscreenVideo.pause();
    startscreenVideo.currentTime = 0;
    startscreenVideo.muted = true;
    startscreenVideo.style.display = 'block';
    startscreenVideo.play().catch(e => console.warn('Startscreen video playback failed:', e));
  }

  window.selectedCoin = null;
  window.selectedVideo = null;
});
