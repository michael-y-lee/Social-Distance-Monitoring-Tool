class VideoDisplay {

    /*
     *  Constructor method
     */
    constructor(parentElement_SD, parentElement_MD, vidMetaData, camMetaData) {
        this.socialDistancingVideo = parentElement_SD;
        this.maskDetectionVideo = parentElement_MD;
        this.videoData = vidMetaData;
        this.cameraData = camMetaData;

        this.displayData = this.videoData; //show all data by default

        this.initVis();
    }


    initVis () {
        let vis = this;

        console.log("Video Display, Data Received:", vis.videoData);

        vis.localLoad = false; //false by default, and when containerized

        if (vis.localLoad) {
            vis.inputVideoURL = 'data/vid/raw/';
            vis.sdOutputVideoURL = 'data/vid/proc/sd/';
            vis.mwOutputVideoURL = 'data/vid/proc/md/';
        } else {
            vis.inputVideoURL = 'https://storage.cloud.google.com/project_ac295/input/';
            vis.sdOutputVideoURL = 'https://storage.cloud.google.com/project_ac295/social_distancing/output_video/';
            vis.mwOutputVideoURL = 'https://storage.cloud.google.com/project_ac295/mask_detection/output_video/';
        }

        vis.wrangleData();

    }


    /*
     *  Data wrangling
     */
    wrangleData () {
        let vis = this;

        // No data wrangling/filtering needed

        // Update the visualization
        vis.updateVis();

    }

    updateVis() {
        let vis = this;

        //select data from camera selected
        vis.displayData = vis.videoData[selectedCameraNum-1] // index offset the camera number cameraNum

        document.getElementById("cam-city").innerHTML = 'Cam #'+vis.cameraData[selectedCameraNum-1].camNum+' - Bond Street, London UK';
        document.getElementById("cam-location").innerHTML = 'Location: </br> ' + vis.cameraData[selectedCameraNum-1].camDescription;

        console.log(vis.inputVideoURL,vis.displayData.clipName,".mp4")

        if(selectedCameraNum === 1) {
            //update preview video
            let camPreviewVideoHtml = (`<form action="" method="post" id="camera_file_name">
                                        <button type="submit" name="selectClip" value="${vis.displayData.clipName}.mp4"/>
                                        <video id="camPreviewVideo" muted>
                                        <source src="${vis.inputVideoURL}${vis.displayData.clipName}.mp4" type="video/mp4">
                                        Your browser does not support HTML video.
                                        </video></button></form></br><p> Date: ${vis.displayData.rawdate}, ${vis.displayData.rawTime}, ${vis.displayData.vidLengthSec} Seconds</p>`);
            //show previews of camera image selected
            document.getElementById("camera-clips").innerHTML = camPreviewVideoHtml;

            //update SD video
            vis.displayData = vis.videoData[selectedCameraNum-1] // index offset the camera number
            let sdCamVideoHtml = (`<video id="sdvideo" muted>
                                <source src="${vis.sdOutputVideoURL}${vis.displayData.clipName}.mp4" type="video/mp4">
                                Your browser does not support HTML video.
                                </video>`);
            //show social detection video of camera image selected
            document.getElementById("sd-video-container").innerHTML = sdCamVideoHtml;

            let mdCamVideoHtml = (`<video id="mwvideo" muted>
                                <source src="${vis.mwOutputVideoURL}${vis.displayData.clipName}.mp4" type="video/mp4">
                                Your browser does not support HTML video.
                                </video>`);
            //show mask wearing detection video of camera image selected
            console.log(mdCamVideoHtml)
            document.getElementById("mw-video-container").innerHTML = mdCamVideoHtml;
        } else {
            //update preview video
            let camPreviewVideoHtml = (`<video id="camPreviewVideo" muted>
                                <source src="${vis.inputVideoURL}${vis.displayData.clipName}.mp4" type="video/mp4">
                                Your browser does not support HTML video.
                                </video></br><p> Date: ${vis.displayData.rawdate}, ${vis.displayData.rawTime}, ${vis.displayData.vidLengthSec} Seconds</p>`);
            //show previews of camera image selected
            document.getElementById("camera-clips").innerHTML = camPreviewVideoHtml;

            //update SD video
            vis.displayData = vis.videoData[selectedCameraNum-1] // index offset the camera number
            let sdCamVideoHtml = (`<video id="sdvideo" muted>
                                <source src="${vis.sdOutputVideoURL}${vis.displayData.clipName}.mp4" type="video/mp4">
                                Your browser does not support HTML video.
                                </video>`);
            //show social detection video of camera image selected
            document.getElementById("sd-video-container").innerHTML = sdCamVideoHtml;

            let mdCamVideoHtml = (`<video id="mwvideo" muted>
                                <source src="${vis.mwOutputVideoURL}${vis.displayData.clipName}.mp4" type="video/mp4">
                                Your browser does not support HTML video.
                                </video>`);
            //show mask wearing detection video of camera image selected
            console.log(mdCamVideoHtml)
            document.getElementById("mw-video-container").innerHTML = mdCamVideoHtml;
        }


    }

}

