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
        
        // Use specific camera if available
        const constraints = availableCameras.length > 0 
            ? { video: { deviceId: { exact: availableCameras[currentCameraIndex].deviceId } } }
            : { video: true };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            video.classList.add('active');
            placeholder.classList.add('hidden');
            
            isVideoActive = true;
            
            // Enable analyze button
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze waste';
        };
        
    } catch (error) {
        
        let errorMessage = 'Camera access denied. Click to try again.';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera permission denied. Please allow camera access and click to try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Camera not supported in this browser.';
        }
        
        updatePlaceholder('🚫', errorMessage);
    }
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

// Camera switch button functionality
document.getElementById('camera-switch-btn').addEventListener('click', switchCamera);

window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
});
