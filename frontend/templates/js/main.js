console.log("Starting Social Distancing Monitor")

// Function to convert date objects to strings or reverse
let dateFormatter = d3.timeFormat("%Y-%m-%d");
let dateParser = d3.timeParse("%Y-%m-%d");
let timeParser = d3.timeParse("%H:%M:%S");

// Variable for the visualization instance
let camLocationMap;
let videoDisplay;
let planView;
let resultsChartCam;
let resultsChartStreet;

//video playback
let framesPerSecond = 30;
let secondsperframe = (1/framesPerSecond);
let simPlay = false;

//WEBSITE STATE VARIABLES
let selectedCameraNum = 1;
let currentFrameNumber = 1;
let currentPlaybackTimeSec = 0; // in seconds;
let currentPlaybackTimeFrames = getFrameNum(currentPlaybackTimeSec); //in frames

//data variables
let cameraMetaData = [];
let videoMetaData = [];
let sdDisplayData = []; // social distancing stats to display on map
let mwDisplayData = [];

// JSON table locations
let storageBucket_url = 'https://storage.googleapis.com/project_ac295/';

let camData_url = storageBucket_url + 'input/cameraInfo.json';
let vidData_url = storageBucket_url + 'input/videoMetaData.json';


//JSON local storage locations, for testing
let camData_loc = 'templates/data/json/cameraInfo.json';
let vidData_loc = 'templates/data/vid/videoMetaData.json';


//Global load of JSON data
// fetch(camData_url, function(d){
// })
//     .then(response => response.json())
//     .then(data => { renderCameras(data)});
//
// fetch(vidData_url, {mode: 'no-cors'}, function(d){
// })
//     .then(response => response.json())
//     .then(data => { renderVideoFeeds(data)});

//Local load of JSON data
// d3.json(camData_loc).then(jsonData => {
//     console.log("Camera Data JSON", jsonData);
//     cameraMetaData = jsonData;
// });
//
// d3.json(vidData_loc).then(jsonData => {
//     console.log("Video Data Geo Json", jsonData);
//     videoMetaData = jsonData;
// });

renderCameras(cameraMetaDataRaw);
renderVideoFeeds(videoMetaDataRaw);

function renderCameras(camData) {

    // log data
    console.log("Camera Data", camData)
    // console.log(data.cameras[0].camLocation[0])

    // Extract list with stations from JSON response
    // create empty data structure
    // Prepare data by looping over items  and populating empty data structure
    cameraMetaData = camData.cameras.map(function (d) {
        let result = {
            camNum: d.cameraNum,
            camName: d.cameraName,
            camDescription: d.cameraDescription,
            camlong: d.camLocation[1],
            camlat: d.camLocation[0],
            camPointingDirection: d.cameraDirection,
            camFieldX: d.cameraField.x,
            camFieldY: d.cameraField.y,
            camFieldHeight: d.cameraField.height,
            camFieldWidth: d.cameraField.width,
            camFieldRotation: d.cameraField.rotation,
            camOffsetX: d.cameraField.caliboffsetx,
            camOffsetY: d.cameraField.caliboffsety,
            camScaleX: d.cameraField.scaleX,
            camScaleY: d.cameraField.scaleY,
            cameraDotX: d.cameraField.camDotX,
            cameraDotY: d.cameraField.camDotY
        }
        return result;
    });

    // // Display number of stations in DOM
    // $("#station-count").text(stationData.length);
}

function renderVideoFeeds(videoData) {

    // log data
    console.log("Video Feeds Meta Data", videoData)

    videoMetaData = videoData.videos.map( function (d) {
        let result = {
            clipName: d.videoCaptureName,
            cameraLocation: +d.cameraLocation,
            date: dateParser(d.date),
            rawdate: d.date,
            startTime : timeParser(d.startTime),
            rawTime: d.startTime,
            vidLengthSec: +d.vidLengthSec,
        }
        return result;
    });
}


// Instantiate visualization object (social distancing map of London)
camLocationMap = new CameraMap("camera-map", cameraMetaData, sdDisplayData, mwDisplayData, videoMetaData, [51.51447479116361, -0.14822436946382580]);
videoDisplay = new VideoDisplay("sd-video-container", "mw-video-container", videoMetaData, cameraMetaData);
planView = new PlanViewMap("plan-view", cameraMetaData, sdDisplayData, mwDisplayData, videoMetaData);
resultsChartCam = new ResultsChartCamera("compliance-chart-cam", videoMetaData, cameraMetaData, sdDisplayData, mwDisplayData);
resultsChartStreet = new ResultsChartLocation("compliance-chart-street", videoMetaData, cameraMetaData, sdDisplayData, mwDisplayData);


let simTimeStep;

function halfSecondStep() {
    if (simPlay) {
        //run the frame counter simultaneously{
        currentFrameNumber += framesPerSecond/2;
        planView.updateVis()
    }
}

function runSim() {
    simTimeStep = setInterval(halfSecondStep, 480);
}

function pauseSim() {
    clearInterval(simTimeStep);
}


//video play and sim playback control functions
function playPause() {

    if (simPlay) {
        simPlay = false;
    } else {
        simPlay = true;
    }

    let previewVid = document.getElementById("camPreviewVideo");
    let sdvideo = document.getElementById("sdvideo");
    let mwvideo = document.getElementById("mwvideo");

    if (previewVid.paused) {
        previewVid.play();
    } else {
        previewVid.pause();
    }

    if (sdvideo.paused) {
        sdvideo.play();
        document.getElementById("vid-timestamp-secs").innerHTML = ''; //in seconds
        document.getElementById("vid-timestamp-frames").innerHTML =  ''; //in frames
        runSim();
    } else {
        sdvideo.pause();
        currentPlaybackTimeSec = sdvideo.currentTime;
        currentFrameNumber = getFrameNum(currentPlaybackTimeSec); //force set frame number
        document.getElementById("vid-timestamp-secs").innerHTML = getDigitalTimeDisplay(currentPlaybackTimeSec); //in seconds
        document.getElementById("vid-timestamp-frames").innerHTML =  "Frame " + getFrameNum(currentPlaybackTimeSec); //in frames
        pauseSim();
    }

    if (mwvideo.paused) {
        mwvideo.play();
    } else {
        mwvideo.pause();
    }
}

function rewind () {

    simPlay = false;

    let previewVid = document.getElementById("camPreviewVideo");
    let sdvideo = document.getElementById("sdvideo");
    let mwvideo = document.getElementById("mwvideo");

    previewVid.pause();
    previewVid.currentTime = 0;

    sdvideo.pause();
    sdvideo.currentTime = 0;
    currentFrameNumber = 1;
    document.getElementById("vid-timestamp-secs").innerHTML = "00:00:00"; //in seconds
    document.getElementById("vid-timestamp-frames").innerHTML =  "Frame 0000"; //in frames
    planView.updateCameraLocation() //reset view
    pauseSim();

    mwvideo.pause();
    mwvideo.currentTime = 0;
}



//UTILITY FUNCTIONS

function round(n) {
    if (!n) {
        return 0;
    }
    return Math.floor(n * 100) / 100;
}

function getFrameNum(timestamp) {
    return Math.floor(timestamp * framesPerSecond);
}

function getDigitalTimeDisplay(inputSeconds) {
    //intakes a count of elapsed seconds, and outputs a formatted elapsed time string
    //MM:SS:CC --> 05:22:12 --> 5 min 22.12 seconds
    let runningSubSec = inputSeconds % 1;
    let runningSec = ((inputSeconds - runningSubSec ) % 60);
    let runningMin = ((inputSeconds - runningSec - runningSubSec) / 60);
    runningSubSec = runningSubSec*100;
    if (runningMin < 10) {
        runningMin = "0" + round(runningMin);
    }
    if (runningSec < 10) {
        runningSec = "0" + round(runningSec);
    }
    if (runningSubSec < 10) {
        runningSubSec = "00";
    }
    runningSubSec = round(runningSubSec);
    let digitalDisplay = runningMin + ":" + runningSec + ":" + runningSubSec;
    return digitalDisplay;
}