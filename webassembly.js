import { BarcodeDetector } from "https://fastly.jsdelivr.net/npm/barcode-detector@2/dist/es/pure.min.js";

const el = {};

document
    .querySelectorAll('[id]')
    .forEach(element => el[element.id] = element);

const canvasXaxis = 640;
const canvasYaxis = 480;
const canvas = el.canvas;
canvas.width = canvasXaxis;
canvas.height = canvasYaxis;
const ctx = canvas.getContext('2d');

let supportedFormats = {};

let detector = null;

let scanCount = 0;
let scannedBarcodes = [];
let deviceId;

getDevices();
createDetector();

async function createDetector() {
    supportedFormats = await BarcodeDetector.getSupportedFormats();
    el.formats.innerHTML = supportedFormats.join(', ');
    detector = new BarcodeDetector({ formats: supportedFormats });
}

function getDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
    } else {
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                devices.forEach((device) => {
                    if (device.kind == 'videoinput') {
                        console.log(`${device.kind}: ${device.label} id = ${device.deviceId}; label=${device.label}`);
                        var option = document.createElement('option');
                        option.value = device.deviceId;
                        option.text = device.label || 'camera ' + (el.camera.options.length + 1);
                        el.camera.appendChild(option);
                    }
                });
            })
            .catch((err) => {
                console.error("Exception: " + err);
            });
    }
}

async function detect(imageData) {
    var barcodes = await detector.detect(imageData);

    if (barcodes.length > 0) {
        scanCount = ++scanCount;
        el.SuccessfulScanCount.innerText = "Scan count " + scanCount;

        if (!scannedBarcodes.includes(barcodes[0].rawValue)) {
            scannedBarcodes.push(barcodes[0].rawValue);
            var li = document.createElement("li");
            li.appendChild(document.createTextNode(`${barcodes[0].rawValue} - ${barcodes[0].format}`));
            el.result.appendChild(li);
        }
    }

    requestId = requestAnimationFrame(() => processFrame(el.video));
}

function processFrame(source) {
    ctx.drawImage(source, 0, 0, canvasXaxis, canvasYaxis)
    const imageData = ctx.getImageData(0, 0, canvasXaxis, canvasYaxis, { willReadFrequently: true });
    detect(imageData);
}

function selectUserMediaAndStartVideo() {
    navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId: deviceId } })
        .then(stream => {
            el.video.srcObject = stream;
            el.video.play();
            processFrame(el.video);
        })
        .catch(error => {
            el.result.innerText = JSON.stringify(error);
            console.log("Exception: " + JSON.stringify(error));
        });
}

el.openVideoBtn.addEventListener('click', event => {
    deviceId = el.camera.options[el.camera.options.selectedIndex].value;
    console.log(`Selected device id: ${deviceId}`);
    selectUserMediaAndStartVideo();
})

el.closeVideoBtn.addEventListener('click', event => {
    el.video.pause();
    el.video.currentTime = 0;
    el.video.srcObject = null;
})
