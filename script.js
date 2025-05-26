let stream = null;
let isVideoActive = false;
let countdownTimer = null;

// Backend API configuration
const BACKEND_API_URL = 'https://workers-playground-bitter-term-7fe4.lucas-vilsen.workers.dev/generate';

function checkSecureContext() {
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
        console.warn("Camera access requires HTTPS or localhost");
        return false;
    }
    return true;
}

async function requestCameraAccess() {
    console.log("Requesting camera access...");
    
    if (!checkSecureContext()) {
        updatePlaceholder('🚫', 'Camera requires HTTPS. Click to try again.');
        return;
    }

    try {
        const video = document.getElementById('webcam-video');
        const placeholder = document.getElementById('webcam-placeholder');
        const analyzeButton = document.getElementById('identify-btn');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not supported in this browser');
        }
        
        console.log("Requesting media stream...");
        
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: true
        });
        
        console.log("Camera access granted!");
        
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            console.log("Video loaded, showing stream");
            video.classList.add('active');
            placeholder.classList.add('hidden');
            
            isVideoActive = true;
            
            // Enable analyze button
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze waste';
        };
        
    } catch (error) {
        console.error('Camera access error:', error);
        
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
console.log("Page loaded, requesting camera access...");
requestCameraAccess();

function captureFrame() {
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('frozen-frame');
    
    if (!video.videoWidth || !video.videoHeight) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Return base64 encoded image for OpenAI API
    return canvas.toDataURL('image/jpeg', 0.8);
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

async function testBackendConnection() {
    try {
        console.log('Testing backend connection...');
        const testResponse = await fetch(BACKEND_API_URL, {
            method: 'OPTIONS'
        });
        console.log('OPTIONS request status:', testResponse.status);
        return true;
    } catch (error) {
        console.error('Backend connection test failed:', error);
        return false;
    }
}

async function postToWorker(imageBase64, prompt) {
    const res = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, text: prompt })
    });
  
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Worker error ${res.status}: ${msg}`);
    }
    return res.json();        // { response: "…” }
  }

async function analyzeImage(imageBase64) {
    const prompt = `Based on the following description return the following information in a json format: {fraction: str, purity: int, subfraction: str}
  
  purity has to be an int between 1 and 10, where 10 is extremely pure with no abnomalies, and 1 is extremely dirty with nothing that can 
  
  fraction has to be one of: Madaffald, glas, papir, metal, blød plast, hård plast, farligt affald, mad- og drikkekartoner, pap, tekstiler, restaffald.
  
  Subfraction has to be 1 word describing what the item is.`;
  
    /* talk to the Worker */
    const { response } = await postToWorker(imageBase64, prompt);
  
    /* pull the JSON snippet out of the model’s reply */
    const match = response.match(/\{[^}]+\}/);
    if (!match) throw new Error('AI returned no JSON');
  
    return JSON.parse(match[0]);     // { fraction, purity, subfraction }
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
            console.log("AI Response:", results);
            showResults(results);
            
        } catch (error) {
            console.error("Analysis error:", error);
            showResults({
                fraction: "Error",
                purity: "AI could not run in your browser",
                subfraction: "Try again"
            });
        }
        
        startCountdown(this);
    }
});

window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
});
