/*
 *  CameraMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

class CameraMap {

	/*
	 *  Constructor method
	 */
	constructor(parentElement, cameraData, socDistData, maskData, videoMetaD, setView) {
		this.parentElement = parentElement;
		this.camData = cameraData;
		this.sdData = socDistData;
		this.maskData = maskData;
		this.videoData = videoMetaD;
		this.setView = setView

		this.initVis();
	}

	/*
	 *  Initialize camera street map
	 */
	initVis () {
		let vis = this;

		L.Icon.Default.imagePath = 'https://storage.cloud.google.com/project_ac295/static_assets/'

		vis.map = L.map(vis.parentElement).setView(vis.setView, 18); //max zoom is 18

		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(vis.map);

		//layer groups
		vis.cameraLocations = L.layerGroup().addTo(vis.map);

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

		console.log("Cam Data to Display:", vis.camData);

		// Create markers on layer group
		vis.camData.forEach(camLocation => {
			vis.cameraLocations.addLayer(L.marker([camLocation.camlat, camLocation.camlong]).addTo(vis.map))

			// Create a marker and bind a popup with a particular HTML content
			let popupContent = "<strong><h5>Cam #" + camLocation.camNum + "</strong></h5>";
			popupContent += "Camera Location: <i>" + camLocation.camDescription + "</i></br>"
			popupContent += "<b>Social Distancing Status: <i style='color:red'>7.62%</i><br></b>" //<-- Fill in SD stats here!!!!
			popupContent += "<b>Mask Wearing Status: <i style='color:red'>8.33%</i></b>" //<-- Fill in SD stats here!!!!

			let marker = L.marker([camLocation.camlat, camLocation.camlong])
				.bindPopup(popupContent)
				.addTo(vis.map)
				.on('click', onMapClick);

			function onMapClick(markerDot) {
				console.log("Switching Cameras to", camLocation.camNum)
				//set that camera number and re-render the website
				selectedCameraNum = camLocation.camNum;
				camLocationMap.updateVis();
				videoDisplay.updateVis();
				resultsChartCam.wrangleData();
				planView.updateCameraLocation();
			}

		});

	}

}

