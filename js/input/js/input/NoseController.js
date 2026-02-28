function NoseController(config) {
  var onVirtualKey = config.onVirtualKey;
  var onStatus = config.onStatus || function() {};

  var video;
  var camera;
  var faceMesh;
  var stream;

  var calibrated = false;
  var calibrationSamples = [];
  var neutralX = 0.5;
  var neutralY = 0.5;
  var smoothX = 0.5;
  var smoothY = 0.5;

  var leftPressed = false;
  var rightPressed = false;
  var runPressed = false;
  var jumpTimeout;
  var noFaceCounter = 0;
  var running = false;
  var jumpCooldownUntil = 0;

  var that = this;

  function setKey(code, state) {
    onVirtualKey(code, state);
  }

  function setDirectionalState(nextLeft, nextRight) {
    if (nextLeft !== leftPressed) {
      setKey(37, nextLeft);
      leftPressed = nextLeft;
    }

    if (nextRight !== rightPressed) {
      setKey(39, nextRight);
      rightPressed = nextRight;
    }
  }

  function setRunState(nextRun) {
    if (nextRun !== runPressed) {
      setKey(16, nextRun);
      runPressed = nextRun;
    }
  }

  function pulseJump() {
    if (Date.now() < jumpCooldownUntil) {
      return;
    }

    jumpCooldownUntil = Date.now() + 700;
    setKey(32, true);

    clearTimeout(jumpTimeout);
    jumpTimeout = setTimeout(function() {
      setKey(32, false);
    }, 120);
  }

  function releaseAll() {
    setDirectionalState(false, false);
    setRunState(false);
    setKey(32, false);
  }

  function handleResults(results) {
    if (!running) {
      return;
    }

    var landmarks = results.multiFaceLandmarks && results.multiFaceLandmarks[0];

    if (!landmarks || !landmarks[1]) {
      noFaceCounter++;

      if (noFaceCounter > 10) {
        onStatus('No face detected');
        releaseAll();
      }

      return;
    }

    noFaceCounter = 0;

    var nose = landmarks[1];
    var alpha = 0.35;

    smoothX = smoothX + alpha * (nose.x - smoothX);
    smoothY = smoothY + alpha * (nose.y - smoothY);

    if (!calibrated) {
      calibrationSamples.push({ x: smoothX, y: smoothY });
      var remaining = 45 - calibrationSamples.length;
      onStatus('Calibrating... Keep head centered (' + (remaining > 0 ? remaining : 0) + ')');

      if (calibrationSamples.length >= 45) {
        var totalX = 0;
        var totalY = 0;

        for (var i = 0; i < calibrationSamples.length; i++) {
          totalX += calibrationSamples[i].x;
          totalY += calibrationSamples[i].y;
        }

        neutralX = totalX / calibrationSamples.length;
        neutralY = totalY / calibrationSamples.length;
        calibrated = true;
        onStatus('Nose control active');
      }

      return;
    }

    var dx = smoothX - neutralX;
    var dy = smoothY - neutralY;
    var deadZoneX = 0.025;
    var sprintThreshold = 0.06;
    var jumpThreshold = -0.03;

    if (dx > deadZoneX) {
      setDirectionalState(false, true);
    } else if (dx < -deadZoneX) {
      setDirectionalState(true, false);
    } else {
      setDirectionalState(false, false);
    }

    setRunState(Math.abs(dx) > sprintThreshold);

    if (dy < jumpThreshold) {
      pulseJump();
    }
  }

  this.start = async function() {
    if (running) {
      return;
    }

    if (!window.FaceMesh || !window.Camera) {
      onStatus('Face tracking library unavailable');
      return;
    }

    running = true;
    calibrated = false;
    calibrationSamples = [];
    onStatus('Requesting camera permission...');

    video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.muted = true;
    video.style.display = 'none';
    document.body.appendChild(video);

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });

      video.srcObject = stream;

      faceMesh = new FaceMesh({
        locateFile: function(file) {
          return 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/' + file;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults(handleResults);

      camera = new Camera(video, {
        onFrame: async function() {
          if (running) {
            await faceMesh.send({ image: video });
          }
        },
        width: 640,
        height: 480
      });

      await camera.start();
      onStatus('Calibrating... Keep head centered');
    } catch (error) {
      running = false;
      releaseAll();
      onStatus('Camera access failed');
    }
  };

  this.stop = function() {
    if (!running) {
      return;
    }

    running = false;
    releaseAll();

    clearTimeout(jumpTimeout);

    if (stream) {
      var tracks = stream.getTracks();

      for (var i = 0; i < tracks.length; i++) {
        tracks[i].stop();
      }
    }

    if (video && video.parentNode) {
      video.parentNode.removeChild(video);
    }

    stream = null;
    video = null;
    camera = null;
    faceMesh = null;

    onStatus('Nose control stopped');
  };

  this.recenter = function() {
    calibrated = false;
    calibrationSamples = [];
  };
}
