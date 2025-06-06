
const video = document.getElementById('video');
const screensaverAudio = document.getElementById('screensaver-audio');
const clickSound = document.getElementById('click-sound');
const claimButton = document.getElementById('claim-button');
const claimAudio = document.getElementById('claim-audio');
const coins = document.querySelectorAll('.coin');
const chooseText = document.querySelector('.choose-text');
const myClientId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);

// Startscreen-Elemente
const startscreen = document.getElementById('startscreen');
const startButton = document.getElementById('start-button');
const mainContent = document.getElementById('main-content');

// Begleit-Ton für Prophezeiungsvideos
let prophecyAudio = null;

// Merke dir, ob dieses Gerät der Sender der aktuellen Prophezeiung ist
let isCurrentProphecySender = false;
// Merke dir, wer der Sender der aktuellen Prophezeiung ist
let prophecySenderId = null;

// Verbindung zum WebSocket-Server herstellen
const ws = new WebSocket('wss://blessed-socket-server-f08da3206592.herokuapp.com:443');

ws.onopen = () => {
  console.log('WebSocket verbunden!');
};
ws.onerror = (err) => {
  console.error('WebSocket Fehler:', err);
};

// Nachricht empfangen und darauf reagieren
ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('Empfangen:', data, 'Mein ClientId:', myClientId);

    // Prophezeiungstext anzeigen (optional)
    if (data.type === 'prophecy') {
      const display = document.getElementById('display');
      if (display) display.innerText = data.payload;
    }

    // Prophezeiungsvideo abspielen (synchron auf allen Geräten)
    if (data.type === 'coin') {
      // Merke, ob dieses Gerät der Sender ist
      isCurrentProphecySender = (data.sender === myClientId);
      prophecySenderId = data.sender;

      // Stoppe evtl. laufenden Begleit-Ton
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
      video.muted = true; // Immer muted!
      video.style.display = 'block';
      video.load();
      video.play().catch(e => console.warn('Prophezeiungsvideo konnte nicht abgespielt werden:', e));
      chooseText.textContent = `Prophecy for coin ${data.coin}`;

      // Begleit-Ton für videoA1.mp4 abspielen
      if (data.video.includes('videoA1.mp4')) {
        prophecyAudio = new Audio('assets/begleit_ton_videoA1.mp3');
        prophecyAudio.currentTime = 0;
        prophecyAudio.play().catch(e => console.warn('Begleit-Ton konnte nicht abgespielt werden:', e));
      } else {
        prophecyAudio = null;
      }
      }, Math.max(0, delay));
    }

    // Claim-Button verstecken und Screensaver starten
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

    // Screensaver synchron starten
    if (data.type === 'screensaver_start') {
      video.currentTime = 0;
      video.play();
    }

    // Claim-Button gezielt anzeigen (WebSocket-Lösung)
    if (data.type === 'show_claim' && myClientId === data.prophecySender) {
      claimButton.style.display = 'block';
      claimAudio.currentTime = 0;
      claimAudio.loop = true;
      claimAudio.play().catch(e => console.warn('Claim-Audio konnte nicht abgespielt werden:', e));
      chooseText.textContent = 'If you accept the prophecy, touch the word below to seal it.';
      coins.forEach(coin => coin.style.visibility = 'hidden');
    }
  } catch (e) {
    // Nachricht war kein JSON (z.B. "ping") – ignoriere sie einfach
  }
};

function startScreensaver() {
  video.src = 'assets/screensaver.mp4';
  video.loop = true;
  video.muted = true;
  video.style.display = 'block';
  video.load();
  video.play().catch(e => console.warn('Screensaver-Video konnte nicht abgespielt werden:', e));
  // Screensaver-Audio nur hier starten!
  screensaverAudio.currentTime = 0;
  screensaverAudio.play().catch(e => console.warn('Screensaver-Audio konnte nicht abgespielt werden:', e));
  claimButton.style.display = 'none';
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

  // Reset UI to start screen without page reload
  mainContent.classList.add('hidden');
  intermediatePage.classList.add('hidden');
  const inputPage = document.getElementById('input-page');
  if (inputPage) {
    inputPage.classList.add('hidden');
  }
  startscreen.classList.remove('hidden');

  // Reset and play startscreen video
  const startscreenVideo = document.getElementById('startscreen-video');
  if (startscreenVideo) {
    startscreenVideo.pause();
    startscreenVideo.currentTime = 0;
    startscreenVideo.muted = true;
    startscreenVideo.style.display = 'block';
    startscreenVideo.play().catch(e => console.warn('Startscreen video playback failed:', e));
  }

  // Clear selected coin and video
  window.selectedCoin = null;
  window.selectedVideo = null;
});claimButton.addEventListener('click', () => {
  // ... (rest of the code)

  // Clear selected coin and video
  window.selectedCoin = null;
  window.selectedVideo = null;

  // Start screensaver
  startScreensaver();
});intermediateVideo.addEventListener('ended', () => {
  intermediatePage.classList.add('hidden');
  mainContent.classList.remove('hidden');
  // Play the next video here
  const nextVideo = document.getElementById('background-video');
  nextVideo.play().catch(e => console.warn('Next video playback failed:', e));
});  coins.forEach(coin => coin.style.visibility = 'visible');
  ws.send(JSON.stringify({ type: 'screensaver_start', timestamp: Date.now() }));
}

// Start Button Event Listener
startButton.addEventListener('click', () => {
  startscreen.classList.add('hidden');
  intermediatePage.classList.remove('hidden');
  intermediateVideo.classList.remove('hidden');
  intermediateVideo.play().catch(e => console.warn('Intermediate video playback failed:', e));
});

// Intermediate Video Event Listener
intermediateVideo.addEventListener('ended', () => {
  intermediatePage.classList.add('hidden');
  mainContent.classList.remove('hidden');
  backgroundVideo.play().catch(e => console.warn('Background video playback failed:', e));
});

// Coin Event Listeners
coins.forEach(coin => {
  coin.addEventListener('click', (event) => {
    mainContent.classList.add('hidden');
    inputPage.classList.remove('hidden');
    inputPage.classList.remove('hidden-flicker');
    const selectedCoin = event.target.dataset.button;
    console.log(`Coin ${selectedCoin} selected`);
  });
});

// Submit Prophecy Event Listener
submitProphecy.addEventListener('click', () => {
  const prophecyInput = document.getElementById('prophecy-input');
  const prophecyText = prophecyInput.value;
  console.log(`Prophecy: ${prophecyText}`);
  inputPage.classList.add('hidden');
  mainContent.classList.remove('hidden');
});

// Claim Button Event Listener
claimButton.addEventListener('click', () => {
  console.log('Claim button clicked');
  mainContent.classList.add('hidden');
  startscreen.classList.remove('hidden');
  startscreenVideo.play().catch(e => console.warn('Startscreen video playback failed:', e));
});

// Klick auf Münze
coins.forEach(coin => {
  coin.addEventListener('click', (event) => {
    console.log('Coin clicked:', event.target.dataset.button);
    screensaverAudio.pause();
    screensaverAudio.currentTime = 0;

    // Andere Münzen ausblenden
    coins.forEach(c => {
      if (c !== event.target) c.style.visibility = 'hidden';
    });

    // Zufälliges Prophezeiungsvideo wählen
    const buttonType = event.target.dataset.button;
    const videos = {
      A: ['assets/videoA1.mp4', 'assets/videoA2.mp4', 'assets/videoA3.mp4'],
      B: ['assets/videoB1.mp4', 'assets/videoB2.mp4', 'assets/videoB3.mp4'],
      C: ['assets/videoC1.mp4', 'assets/videoC2.mp4', 'assets/videoC3.mp4']
    };
    const selectedVideos = videos[buttonType];
    if (!selectedVideos) return;
    const randomVideo = selectedVideos[Math.floor(Math.random() * selectedVideos.length)];

    // Store selected coin and video for later use
    window.selectedCoin = buttonType;
    window.selectedVideo = randomVideo;

    // Show input page and hide main content
    mainContent.classList.add('hidden');
    const inputPage = document.getElementById('input-page');
    inputPage.classList.remove('hidden');
    inputPage.classList.remove('hidden-flicker');

    // Clear previous input
    const prophecyInput = document.getElementById('prophecy-input');
    prophecyInput.value = '';

    // Focus input field
    prophecyInput.focus();
  });
});

const submitProphecyButton = document.getElementById('submit-prophecy');
submitProphecyButton.addEventListener('click', () => {
  const prophecyInput = document.getElementById('prophecy-input');
  const inputValue = prophecyInput.value.trim();

  if (inputValue.length === 0) {
    alert('Please enter your prophecy before proceeding.');
    prophecyInput.focus();
    return;
  }

  // Hide input page
  const inputPage = document.getElementById('input-page');
  inputPage.classList.add('hidden');

  // Show main content and only the selected coin
  mainContent.classList.remove('hidden');
  coins.forEach(c => {
    if (c.getAttribute('data-button') !== window.selectedCoin) {
      c.style.visibility = 'hidden';
    } else {
      c.style.visibility = 'visible';
    }
  });

  // Send WebSocket message to start prophecy video
  const startTime = Date.now() + 1000; // 1 second delay
  ws.send(JSON.stringify({
    type: 'coin',
    coin: window.selectedCoin,
    video: window.selectedVideo,
    startTime,
    sender: myClientId
  }));

  // Optionally, send the prophecy text to server or display it locally
  ws.send(JSON.stringify({
    type: 'prophecy',
    payload: inputValue,
    sender: myClientId
  }));
});

/* Removed rotation class removals and additions as videos are pre-rotated in Dropbox */
// Wenn Prophezeiungsvideo zu Ende ist
video.addEventListener('ended', () => {
  // Nach Video-Ende: show_claim-Nachricht senden, damit der Claim-Button garantiert auf dem Sender-Gerät erscheint
  if (prophecySenderId) {
    ws.send(JSON.stringify({ type: 'show_claim', sender: myClientId, prophecySender: prophecySenderId }));
  }
  // Nur auf Geräten, die NICHT der Sender sind: Screensaver starten
  if (myClientId !== prophecySenderId) {
    startScreensaver();
  }
  // Begleit-Ton stoppen
  if (prophecyAudio) {
    prophecyAudio.pause();
    prophecyAudio.currentTime = 0;
  }
});

// Claim-Button gedrückt
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

  // Reset UI to start screen without page reload
  mainContent.classList.add('hidden');
  intermediatePage.classList.add('hidden');
  const inputPage = document.getElementById('input-page');
  if (inputPage) {
    inputPage.classList.add('hidden');
  }
  startscreen.classList.remove('hidden');

  // Reset and play startscreen video
  const startscreenVideo = document.getElementById('startscreen-video');
  if (startscreenVideo) {
    startscreenVideo.pause();
    startscreenVideo.currentTime = 0;
    startscreenVideo.muted = true;
    startscreenVideo.style.display = 'block';
    startscreenVideo.play().catch(e => console.warn('Startscreen video playback failed:', e));
  }
});

// Seite lädt
window.addEventListener('load', () => {
  // Nur Startscreen anzeigen, Hauptinhalt ausblenden
  startscreen.classList.remove('hidden');
  mainContent.classList.add('hidden');
  intermediatePage.classList.add('hidden');

  // Ensure input page is hidden on load
  const inputPage = document.getElementById('input-page');
  if (inputPage) {
    inputPage.classList.add('hidden');
  }

  // Workaround für Autoplay-Restriktionen:
  const unlockMedia = () => {
    video.muted = true;
    video.play().catch(() => {});
    screensaverAudio.play().catch(() => {});
    window.removeEventListener('click', unlockMedia);
    window.removeEventListener('touchstart', unlockMedia);
  };
  window.addEventListener('click', unlockMedia);
  window.addEventListener('touchstart', unlockMedia);
});

const intermediatePage = document.getElementById('intermediate-page');
const intermediateVideo = document.getElementById('intermediate-video');

// Start-Button gedrückt: Wechsel zur Zwischenseite
startButton.addEventListener('click', () => {
  startscreen.classList.add('hidden');
  intermediatePage.classList.remove('hidden');
  intermediateVideo.play().catch(e => console.warn('Intermediate video playback failed:', e));
});

// Wenn das Zwischenseiten-Video endet: Wechsel zum Hauptinhalt
intermediateVideo.addEventListener('ended', () => {
  intermediatePage.classList.add('hidden');
  mainContent.classList.remove('hidden');
  startScreensaver();
});
// ...

// Claim-Button Event Listener
claimButton.addEventListener('click', () => {
  console.log('Claim button clicked');
  mainContent.classList.add('hidden');
  startscreen.classList.remove('hidden');
  startscreenVideo.play().catch(e => console.warn('Startscreen video playback failed:', e));

  // Reset and play startscreen video
  const startscreenVideo = document.getElementById('startscreen-video');
  if (startscreenVideo) {
    startscreenVideo.pause();
    startscreenVideo.currentTime = 0;
    startscreenVideo.muted = true;
    startscreenVideo.style.display = 'block';
    startscreenVideo.play().catch(e => console.warn('Startscreen video playback failed:', e));
  }

  // Clear selected coin and video
  window.selectedCoin = null;
  window.selectedVideo = null;

  // Send WebSocket message to reset UI
  ws.send(JSON.stringify({ type: 'claim' }));

  // Start screensaver
  startScreensaver();
});

// ...