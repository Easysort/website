let stream = null;
let isVideoActive = false;
let countdownTimer = null;
let currentCameraIndex = 0;
let availableCameras = [];
let isRequestingCamera = false;

// Backend API configuration
const BACKEND_API_URL = 'https://workers-playground-bitter-term-7fe4.lucas-vilsen.workers.dev/generate';
const DEBUG = false; // set true temporarily if you want verbose console logs

function checkSecureContext() {
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
        return false;
    }
    return true;
}

async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
        console.error('Error getting cameras:', error);
        return [];
    }
}

async function switchCamera() {
    if (availableCameras.length <= 1) return;
    
    currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
    await requestCameraAccess();
}

async function requestCameraAccess() {
    if (!checkSecureContext()) {
        updatePlaceholder('🚫', 'Camera requires HTTPS. Click to try again.');
        return;
    }

    if (isRequestingCamera) {
        return;
    }

    const video = document.getElementById('webcam-video');
    const placeholder = document.getElementById('webcam-placeholder');
    const analyzeButton = document.getElementById('identify-btn');
    const switchButton = document.getElementById('camera-switch-btn');
    const switchIcon = document.getElementById('camera-switch-icon');
    const webcamArea = document.getElementById('webcam-area');

    isRequestingCamera = true;

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not supported in this browser');
        }
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        let constraints;
        if (availableCameras.length > 0 && availableCameras[currentCameraIndex]) {
            constraints = {
                video: {
                    deviceId: { exact: availableCameras[currentCameraIndex].deviceId }
                }
            };
        } else {
            constraints = { video: true };
        }
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        availableCameras = await getAvailableCameras();
        if (currentCameraIndex >= availableCameras.length) {
            currentCameraIndex = 0;
        }
        
        const showSwitch = availableCameras.length > 1;
        switchButton.style.display = showSwitch ? 'block' : 'none';
        switchIcon.style.display = showSwitch ? 'block' : 'none';
        
        video.srcObject = stream;
        video.muted = true;
        video.style.transform = 'scaleX(1)';
        
        video.onloadedmetadata = async () => {
            try {
                await video.play();
            } catch (playError) {
                if (DEBUG) console.error('Video play error:', playError);
            }
            
            video.classList.add('active');
            placeholder.classList.add('hidden');
            webcamArea.onclick = null;
            webcamArea.style.cursor = 'default';
            
            isVideoActive = true;
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze waste';
            applyVideoOrientation(video);
        };
        
    } catch (error) {
        let errorMessage = 'Camera access denied. Click to try again.';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera permission denied. Please allow camera access in your browser and click to try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Camera not supported in this browser.';
        } else if (error.name === 'OverconstrainedError') {
            if (DEBUG) console.log('Camera constraint error, trying fallback...');
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                availableCameras = await getAvailableCameras();
                video.srcObject = stream;
                video.muted = true;
                video.onloadedmetadata = async () => {
                    try {
                        await video.play();
                    } catch (playError) {
                        if (DEBUG) console.error('Video play error:', playError);
                    }
                    
                    video.classList.add('active');
                    placeholder.classList.add('hidden');
                    webcamArea.onclick = null;
                    webcamArea.style.cursor = 'default';
                    isVideoActive = true;
                    analyzeButton.disabled = false;
                    analyzeButton.textContent = 'Analyze waste';
                    const showSwitch = availableCameras.length > 1;
                    switchButton.style.display = showSwitch ? 'block' : 'none';
                    switchIcon.style.display = showSwitch ? 'block' : 'none';
                    applyVideoOrientation(video);
                };
                return;
            } catch (fallbackError) {
                errorMessage = 'Camera access failed. Please try again.';
            }
        }
        
        isVideoActive = false;
        video.classList.remove('active');
        placeholder.classList.remove('hidden');
        analyzeButton.disabled = true;
        analyzeButton.textContent = 'Enable camera to try demo';
        switchButton.style.display = 'none';
        switchIcon.style.display = 'none';
        updatePlaceholder('🚫', errorMessage);
    } finally {
        isRequestingCamera = false;
    }
}

// New function to handle video orientation properly
function applyVideoOrientation(video) {
    const videoTrack = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
    if (!videoTrack) return;
    
    const capabilities = typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {};
    
    let isFrontCamera = false;
    
    if (capabilities.facingMode && capabilities.facingMode.includes('user')) {
        isFrontCamera = true;
    } else if (capabilities.facingMode && capabilities.facingMode.includes('environment')) {
        isFrontCamera = false;
    } else if (availableCameras.length > 1) {
        isFrontCamera = currentCameraIndex === 1;
    } else if (availableCameras[currentCameraIndex] && availableCameras[currentCameraIndex].label) {
        const label = availableCameras[currentCameraIndex].label.toLowerCase();
        isFrontCamera = label.includes('front') || label.includes('user') || label.includes('selfie') ||
                       label.includes('webcam') || label.includes('built-in') || label.includes('integrated');
    }
    
    if (isFrontCamera) {
        video.style.transform = 'scaleX(-1)';
        if (DEBUG) console.log('Applied front camera mirroring');
    } else {
        video.style.transform = 'scaleX(1)';
        if (DEBUG) console.log('Applied back camera normal orientation');
    }
    
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('muted', 'true');
}

function updatePlaceholder(icon, text) {
    const placeholder = document.getElementById('webcam-placeholder');
    const webcamArea = document.getElementById('webcam-area');
    const webcamText = placeholder.querySelector('.webcam-text');
    const webcamIcon = placeholder.querySelector('.webcam-icon');
    
    webcamIcon.textContent = icon;
    webcamText.textContent = text;
    
    placeholder.style.cursor = 'pointer';
    webcamArea.style.cursor = 'pointer';
    webcamArea.onclick = () => {
        if (!isVideoActive && !isRequestingCamera) {
            requestCameraAccess();
        }
    };
}

function initializeCameraPrompt() {
    const analyzeButton = document.getElementById('identify-btn');
    analyzeButton.disabled = true;
    analyzeButton.textContent = 'Enable camera to try demo';
    updatePlaceholder('📷', 'Allow camera to try it yourself');
}

initializeCameraPrompt();
requestCameraAccess();

function captureFrame() {
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('frozen-frame');
    
    if (!video.videoWidth || !video.videoHeight) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Return base64 encoded image without the data URL prefix
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    return dataURL.split(',')[1]; // Remove "data:image/jpeg;base64," prefix
}

function showFrozenFrame() {
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('frozen-frame');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    
    // Apply the same transform as the video
    const videoTransform = window.getComputedStyle(video).transform;
    if (videoTransform && videoTransform !== 'none') {
        canvas.style.transform = videoTransform;
    }
    
    context.drawImage(video, 0, 0);
    
    canvas.classList.add('show');
}

function hideFrozenFrame() {
    const canvas = document.getElementById('frozen-frame');
    canvas.classList.remove('show');
}

async function analyzeImage(imageBase64) {
    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageBase64
            })
        });


        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const id = data && typeof data.id === 'string' ? data.id : 'backend_error';
            const message = data && typeof data.message === 'string' ? data.message : `Backend error: ${response.status}`;
            if (DEBUG) console.error('Backend error:', { status: response.status, id, message });
            throw new Error('AI analysis failed. Please try again later.');
        }

        if (!data || data.ok !== true || !data.result) {
            if (DEBUG) console.error('Unexpected backend response:', { status: response.status, data });
            throw new Error('AI analysis failed. Please try again later.');
        }

        return data.result;
        
    } catch (error) {
        if (DEBUG) console.error('Analyze error:', error);
        throw new Error('AI analysis failed. Please try again later.');
    }
}

function showResults(results) {
    const resultsArea = document.getElementById('results-area');
    const fractionElement = document.getElementById('result-fraction');
    const purityElement = document.getElementById('result-purity');
    const subclassElement = document.getElementById('result-subclass');
    
    fractionElement.textContent = results.fraction || 'Unknown';
    purityElement.textContent = results.purity || 'Unknown';
    subclassElement.textContent = results.subfraction || 'Unknown';
    
    resultsArea.classList.add('show');
}

function hideResults() {
    const resultsArea = document.getElementById('results-area');
    resultsArea.classList.remove('show');
}

function startCountdown(button) {
    let timeLeft = 10;
    button.disabled = true;
    button.classList.add('countdown');
    
    const updateButton = () => {
        button.textContent = `Wait ${timeLeft}s`;
        timeLeft--;
        
        if (timeLeft === 0) {
            hideFrozenFrame();
            hideResults();
        }
        
        if (timeLeft < 0) {
            button.disabled = false;
            button.classList.remove('countdown');
            button.textContent = 'Analyze waste';
            clearInterval(countdownTimer);
        }
    };
    
    updateButton();
    countdownTimer = setInterval(updateButton, 1000);
}

// Analyze button functionality
document.getElementById('identify-btn').addEventListener('click', async function() {
    if (isVideoActive) {
        const imageBase64 = captureFrame();
        showFrozenFrame();
        
        this.textContent = 'Analyzing...';
        this.disabled = true;
        
        try {
            const results = await analyzeImage(imageBase64);
            showResults(results);
            
        } catch (error) {
            showResults({
                fraction: "AI could not run in browser, try again later or contact us",
                purity: "none",
                subfraction: "none"
            });
        }
        
        startCountdown(this);
    }
});

// Camera switch button functionality with improved mobile support
document.getElementById('camera-switch-btn').addEventListener('click', switchCamera);

// Add touch event support for better mobile interaction
document.getElementById('camera-switch-btn').addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent double-tap zoom on mobile
    this.style.transform = 'scale(0.95)';
});

document.getElementById('camera-switch-btn').addEventListener('touchend', function(e) {
    e.preventDefault();
    this.style.transform = 'scale(1)';
    switchCamera();
});

window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
});
