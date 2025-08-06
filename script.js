let stream = null;
let isVideoActive = false;
let countdownTimer = null;
let currentCameraIndex = 0;
let availableCameras = [];

// Backend API configuration
const BACKEND_API_URL = 'https://workers-playground-bitter-term-7fe4.lucas-vilsen.workers.dev/generate';

function checkSecureContext() {
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
        return false;
    }
    return true;
}

async function getAvailableCameras() {
    try {
        // Request camera permission first to ensure device enumeration works on mobile
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());
        
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

    try {
        const video = document.getElementById('webcam-video');
        const placeholder = document.getElementById('webcam-placeholder');
        const analyzeButton = document.getElementById('identify-btn');
        const switchButton = document.getElementById('camera-switch-btn');
        const switchIcon = document.getElementById('camera-switch-icon');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not supported in this browser');
        }
        
        // Stop current stream if exists
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Get available cameras if not already done
        if (availableCameras.length === 0) {
            availableCameras = await getAvailableCameras();
        }
        
        // Show switch button and icon if multiple cameras available
        const showSwitch = availableCameras.length > 1;
        switchButton.style.display = showSwitch ? 'block' : 'none';
        switchIcon.style.display = showSwitch ? 'block' : 'none';
        
        // Use specific camera if available, without facingMode to prevent orientation issues
        let constraints;
        if (availableCameras.length > 0) {
            constraints = { 
                video: { 
                    deviceId: { exact: availableCameras[currentCameraIndex].deviceId }
                    // Removed facingMode to prevent orientation issues
                } 
            };
        } else {
            constraints = { video: true };
        }
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        video.srcObject = stream;
        
        // Fix video orientation for mobile devices
        video.style.transform = 'scaleX(1)'; // Reset any previous transforms
        
        video.onloadedmetadata = () => {
            video.classList.add('active');
            placeholder.classList.add('hidden');
            
            isVideoActive = true;
            
            // Enable analyze button
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze waste';
            
            // Apply orientation fix for mobile front camera
            applyVideoOrientation(video);
        };
        
    } catch (error) {
        
        let errorMessage = 'Camera access denied. Click to try again.';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera permission denied. Please allow camera access and click to try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Camera not supported in this browser.';
        } else if (error.name === 'OverconstrainedError') {
            // Handle mobile camera switching errors gracefully
            console.log('Camera constraint error, trying fallback...');
            try {
                // Fallback to basic video constraint
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const video = document.getElementById('webcam-video');
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.classList.add('active');
                    document.getElementById('webcam-placeholder').classList.add('hidden');
                    isVideoActive = true;
                    document.getElementById('identify-btn').disabled = false;
                    document.getElementById('identify-btn').textContent = 'Analyze waste';
                    applyVideoOrientation(video);
                };
                return;
            } catch (fallbackError) {
                errorMessage = 'Camera access failed. Please try again.';
            }
        }
        
        updatePlaceholder('🚫', errorMessage);
    }
}

// New function to handle video orientation properly
function applyVideoOrientation(video) {
    // Get the video track to check camera capabilities
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    
    // Get camera settings to determine if it's front or back camera
    const settings = videoTrack.getSettings();
    const capabilities = videoTrack.getCapabilities();
    
    // More precise front camera detection
    let isFrontCamera = false;
    
    // Method 1: Check if facingMode capability includes 'user' (front camera)
    if (capabilities.facingMode && capabilities.facingMode.includes('user')) {
        isFrontCamera = true;
    }
    // Method 2: Check if facingMode capability includes 'environment' (back camera)
    else if (capabilities.facingMode && capabilities.facingMode.includes('environment')) {
        isFrontCamera = false;
    }
    // Method 3: Fallback - use device index (usually front camera is index 1, back is index 0)
    else if (availableCameras.length > 1) {
        // On most devices, front camera is typically the second camera
        isFrontCamera = currentCameraIndex === 1;
    }
    // Method 4: Last resort - check device label for common front camera indicators
    else if (availableCameras[currentCameraIndex] && availableCameras[currentCameraIndex].label) {
        const label = availableCameras[currentCameraIndex].label.toLowerCase();
        isFrontCamera = label.includes('front') || label.includes('user') || label.includes('selfie') || 
                       label.includes('webcam') || label.includes('built-in') || label.includes('integrated');
    }
    
    if (isFrontCamera) {
        // For front camera, mirror the video horizontally (like a mirror)
        video.style.transform = 'scaleX(-1)';
        console.log('Applied front camera mirroring');
    } else {
        // For back camera, keep normal orientation
        video.style.transform = 'scaleX(1)';
        console.log('Applied back camera normal orientation');
    }
    
    // Set video properties for better performance
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('muted', 'true');
}

function updatePlaceholder(icon, text) {
    const placeholder = document.getElementById('webcam-placeholder');
    const webcamText = placeholder.querySelector('.webcam-text');
    const webcamIcon = placeholder.querySelector('.webcam-icon');
    
    webcamIcon.textContent = icon;
    webcamText.textContent = text;
    
    placeholder.style.cursor = 'pointer';
    placeholder.onclick = requestCameraAccess;
}

// Request camera when page loads
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
        const prompt = `Based on the following description return the following information in a json format: {fraction: str, purity: int, subfraction: str}

purity has to be an int between 1 and 10, where 10 is extremely pure with no abnomalies, and 1 is extremely dirty with nothing that can 

fraction has to be one of: Madaffald, glas, papir, metal, blød plast, hård plast, farligt affald, mad- og drikkekartoner, pap, tekstiler, restaffald.

Subfraction has to be 1 word describing what the item is.

Return only the json format!`;

        
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageBase64,
                text: prompt
            })
        });


        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();
        
        // Parse JSON from AI response
        const aiResponse = data.response;
        const jsonMatch = aiResponse.match(/\{[^}]+\}/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('AI could not run in your browser');
        }
        
    } catch (error) {
        throw new Error('AI could not run in your browser');
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
