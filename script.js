const video = document.getElementById('video');
const screensaverAudio = document.getElementById('screensaver-audio');
const clickSound = document.getElementById('click-sound');
const claimButton = document.getElementById('claim-button');
const claimAudio = document.getElementById('claim-audio');
const coins = document.querySelectorAll('.coin');
const chooseText = document.querySelector('.choose-text');

// Verbindung zum WebSocket-Server herstellen
const ws = new WebSocket('wss://blessed-socket-server-f08da3206592.herokuapp.com:443');

ws.onopen = () => {
  console.log('WebSocket verbunden!');
};
ws.onerror = (err) => {
  console.error('WebSocket Fehler:', err);
};

// Funktion zum Senden einer Nachricht
function sendMessage(type, payload) {
  ws.send(JSON.stringify({ type, payload }));
}

// Nachricht empfangen und darauf reagieren
ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    // Beispiel: Zeige empfangene Nachricht im Display-Bereich an
    if (data.type === 'prophecy') {
      document.getElementById('display').innerText = data.payload;
    }
    if (data.type === 'coin') {
      // Alle Münzen ausblenden außer der gewählten
      coins.forEach(c => {
        if (c.getAttribute('data-button') !== data.coin) c.style.visibility = 'hidden';
        else c.style.visibility = 'visible';
      });

      // Video aus der Nachricht verwenden!
      if (!data.video) return;
      const delay = data.startTime - Date.now();
      setTimeout(() => {
        video.src = data.video;
        video.loop = false;
        video.muted = false;
        video.style.display = 'block';
        video.load();
        video.play().catch(e => console.warn('Prophezeiungsvideo konnte nicht abgespielt werden:', e));
        chooseText.textContent = `Prophecy for coin ${data.coin}`;
      }, Math.max(0, delay));
    }
    if (data.type === 'claim') {
      claimButton.style.display = 'none';
      claimAudio.pause();
      claimAudio.currentTime = 0;
      startScreensaver();
    }
    if (data.type === 'screensaver_start') {
      // Optional: Zeitdifferenz berechnen, um möglichst synchron zu starten
      video.currentTime = 0;
      video.play();
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
  // Wenn du willst, dass ein Tab der "Master" ist:
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
      ws.send(JSON.stringify({ type: 'coin', coin: buttonType, video: randomVideo, startTime }));

      // Workaround: Starte das Video auch lokal, falls keine Nachricht zurückkommt
      setTimeout(() => {
        video.src = randomVideo;
        video.loop = false;
        video.muted = false;
        video.style.display = 'block';
        video.load();
        video.play().catch(e => console.warn('Prophezeiungsvideo konnte nicht abgespielt werden:', e));
        chooseText.textContent = `Prophecy for coin ${buttonType}`;
      }, 1000); // gleiche Verzögerung wie in startTime
    };
  });
});

// Wenn Prophezeiungsvideo zu Ende ist
video.addEventListener('ended', () => {
  // Screensaver wieder starten
  video.src = 'assets/screensaver.mp4';
  video.loop = true;
  video.muted = true;
  video.style.display = 'block';
  video.load();
  video.play().catch(e => console.warn('Screensaver-Video konnte nicht abgespielt werden:', e));

  // Screensaver-Audio NICHT starten!
  // Claim-Button und Claim-Audio wie gehabt
  claimButton.style.display = 'block';
  claimAudio.currentTime = 0;
  claimAudio.loop = true;
  claimAudio.play().catch(e => console.warn('Claim-Audio konnte nicht abgespielt werden:', e));
  chooseText.textContent = 'If you accept the prophecy, touch the word below to seal it.';
  coins.forEach(coin => coin.style.visibility = 'hidden');
});

// Claim-Button gedrückt
claimButton.addEventListener('click', () => {
  claimButton.style.display = 'none';
  claimAudio.pause();
  claimAudio.currentTime = 0;
  // Synchronisiere Claim-Button über WebSocket!
  ws.send(JSON.stringify({ type: 'claim' }));
  // Jetzt wird Screensaver-Audio wieder gestartet:
  startScreensaver();
});

// Seite lädt
window.addEventListener('load', () => {
  startScreensaver();

  // Workaround für Autoplay-Restriktionen:
  const unlockMedia = () => {
    screensaverAudio.play().catch(() => {});
    video.play().catch(() => {});
    window.removeEventListener('click', unlockMedia);
    window.removeEventListener('touchstart', unlockMedia);
  };
  window.addEventListener('click', unlockMedia);
  window.addEventListener('touchstart', unlockMedia);
});
