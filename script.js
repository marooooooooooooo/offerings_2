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
const ipad2Button = document.getElementById('startscreen-button-ipad2');
const ipadSelectVideoSrc = 'assets/ipad_select_offering.mp4';
const ipad1Video = document.getElementById('startscreen-video');
const ipad2Video = document.querySelector('#main-content video#background-video') || document.querySelector('#main-content video');
// Show the single start button on startscreen
const oldStartscreenButton = document.getElementById('startscreen-button');
if (oldStartscreenButton) {
  oldStartscreenButton.style.display = 'block';
}

// Add event listeners to the three buttons in main-content continue-buttons-container
const mainContentContinueButtonsContainer = document.querySelector('#main-content #continue-buttons-container');
const mainContentContinueButtons = mainContentContinueButtonsContainer ? mainContentContinueButtonsContainer.querySelectorAll('button.startscreen-button-ipad2') : [];

mainContentContinueButtons.forEach(button => {
  button.addEventListener('click', () => {
    const inputSection = document.getElementById('input-section');
    if (inputSection) {
      inputSection.style.display = 'block';
    }
  });
});

// Add event listener to the single continue button in main-content
const continueButton = document.getElementById('continue-button');
if (continueButton) {
  continueButton.addEventListener('click', () => {
    const inputSection = document.getElementById('input-section');
    if (inputSection) {
      inputSection.style.display = 'block';
    }
  });
});

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
  chooseText.textContent = 'Select a data offering to proceed';
  coins.forEach(coin => coin.style.visibility = 'visible');
  ws.send(JSON.stringify({ type: 'screensaver_start', timestamp: Date.now() }));
}

// Klick auf Münze
coins.forEach(coin => {
  coin.addEventListener('click', (event) => {
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

    // Klick-Sound abspielen und erst nach Ende weitermachen
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.warn('Klick-Sound konnte nicht abgespielt werden:', e));

    clickSound.onended = () => {
      const startTime = Date.now() + 1000; // 1 Sekunde Verzögerung
      ws.send(JSON.stringify({ type: 'coin', coin: buttonType, video: randomVideo, startTime, sender: myClientId }));
      // Kein setTimeout und kein video.play() hier!
    };
  });
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
  claimButton.style.display = 'none';
  claimAudio.pause();
  claimAudio.currentTime = 0;
  if (prophecyAudio) {
    prophecyAudio.pause();
    prophecyAudio.currentTime = 0;
  }
  ws.send(JSON.stringify({ type: 'claim' }));

  // Nach Claim wieder zum Startscreen wechseln
  mainContent.style.display = 'none';
  startscreen.style.display = 'flex';
});

// Seite lädt
window.addEventListener('load', () => {
  // Nur Startscreen anzeigen, Hauptinhalt ausblenden
  startscreen.style.display = 'flex';
  mainContent.style.display = 'none';

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

// Startscreen-Button gedrückt: Wechsel zum Hauptinhalt
if (startscreenButton) {
  startscreenButton.addEventListener('click', (event) => {
    event.preventDefault();
    startscreen.style.display = 'none';
    mainContent.style.display = 'block';
    startScreensaver();

    // Show input section on right side after Continue
    const inputSection = document.getElementById('input-section');
    if (inputSection) {
      inputSection.style.display = 'block';
    }
  });
}

// Handle Continue buttons click
const continueButtons = document.querySelectorAll('#continue-buttons-container button.startscreen-button-ipad2');
continueButtons.forEach(button => {
  button.addEventListener('click', () => {
    // You can add specific behavior for each button here if needed
    // For now, all buttons perform the same action: show input section
    const inputSection = document.getElementById('input-section');
    if (inputSection) {
      inputSection.style.display = 'block';
    }
  });
});

// New event listeners for buttons on startscreen
const startscreenContinueButtonsContainer = document.querySelector('#startscreen #continue-buttons-container');
const startscreenContinueButtons = startscreenContinueButtonsContainer ? startscreenContinueButtonsContainer.querySelectorAll('button.startscreen-button-ipad2') : [];

startscreenContinueButtons.forEach(button => {
  button.addEventListener('click', () => {
    const inputSection = document.getElementById('input-section');
    if (inputSection) {
      inputSection.style.display = 'block';
    }
  });
});

// Show the old single startscreen button
const startscreenButton = document.getElementById('startscreen-button');
if (startscreenButton) {
  startscreenButton.style.display = 'block';
  // Add event listener to switch to ipad_2 video page on click
  startscreenButton.addEventListener('click', (event) => {
    event.preventDefault();
    const startscreen = document.getElementById('startscreen');
    const mainContent = document.getElementById('main-content');
    startscreen.style.display = 'none';
    mainContent.style.display = 'block';
    // Change mainContent video to ipad_2 video
    const backgroundVideo = document.getElementById('background-video');
    if (backgroundVideo) {
      backgroundVideo.src = 'assets/ipad_2.mp4';
      backgroundVideo.loop = true;
      backgroundVideo.muted = true;
      backgroundVideo.load();
      backgroundVideo.play().catch(e => console.warn('ipad_2 video konnte nicht abgespielt werden:', e));
    }
    // Hide the continue buttons container and show the continue button for ipad_2 video
    const continueButtonsContainer = document.getElementById('continue-buttons-container');
    if (continueButtonsContainer) {
      continueButtonsContainer.style.display = 'none';
    }
    const continueButton = document.getElementById('continue-button');
    if (continueButton) {
      continueButton.style.display = 'block';
    }
    // Show input section on right side after Continue
    const inputSection = document.getElementById('input-section');
    if (inputSection) {
      inputSection.style.display = 'block';
    }
  });
}

// Continue button on ipad_2 video clicked: play new video like ipad_1 video
if (ipad2Button) {
  ipad2Button.addEventListener('click', () => {
    ipad2Video.pause();
    ipad2Video.src = ipadSelectVideoSrc;
    ipad2Video.loop = false;
    ipad2Video.muted = true;
    ipad2Video.load();
    ipad2Video.play().catch(e => console.warn('ipad_select_offering video konnte nicht abgespielt werden:', e));
  });
}

// Handle Check button click
const checkButton = document.getElementById('check-button');
if (checkButton) {
  checkButton.addEventListener('click', () => {
    const dataInput = document.getElementById('data-input');
    if (!dataInput) return;
    const inputValue = dataInput.value.trim();
    if (!inputValue) {
      alert('Please enter a data offering.');
      return;
    }

    // Store selected data offering
    localStorage.setItem('selectedDataOffering', inputValue);

    // Play random video on right side similar to coins
    playRandomVideoForDataOffering(inputValue);
  });
}

// Function to play random video on right side based on data offering
function playRandomVideoForDataOffering(dataOffering) {
  const video = document.getElementById('video');
  if (!video) return;

  // Define videos for data offerings (example)
  const videosMap = {
    A: ['assets/videoA1.mp4', 'assets/videoA2.mp4', 'assets/videoA3.mp4'],
    B: ['assets/videoB1.mp4', 'assets/videoB2.mp4', 'assets/videoB3.mp4'],
    C: ['assets/videoC1.mp4', 'assets/videoC2.mp4', 'assets/videoC3.mp4']
  };

  const videos = videosMap[dataOffering.toUpperCase()];
  if (!videos || videos.length === 0) {
    alert('No videos found for the selected data offering.');
    return;
  }

  const randomVideo = videos[Math.floor(Math.random() * videos.length)];
  video.src = randomVideo;
  video.loop = false;
  video.muted = true;
  video.load();
  video.play().catch(e => console.warn('Video playback failed:', e));
}
