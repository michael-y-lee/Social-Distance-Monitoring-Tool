/*
 *  CameraMap - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

class PlanViewMap {

    /*
     *  Constructor method
     */
    constructor(parentElement, cameraData, socDistData, maskData, videoMetaD) {
        this.parentElement = parentElement;
        this.camData = cameraData;
        this.sdData = socDistData;
        this.maskData = maskData;
        this.videoData = videoMetaD;

        this.initVis();
    }

    /*
     *  Initialize camera street map
     */
    initVis () {
        let vis = this;

        ////////// Social Distancing calcs to display over video //////////////////
        vis.SDStats = d3.select("body").append('div')
            .attr('id', 'socialDistancingResults')

        vis.MWStats = d3.select("body").append('div')
            .attr('id', 'maskWearingResults')

        vis.margin = {top: 0, right: 0, bottom: 0, left: 0};
        vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $('#' + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        ////////// CREATE TOOLTIP //////////////////
        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'chartToolTip')


        //display sat image
        let satImageName = vis.videoData[selectedCameraNum - 1].clipName

        vis.svg
            .append("image")
            .attr("href", "https://storage.cloud.google.com/project_ac295/input/sat_images/"+satImageName+".png")
            // .attr("href", "{{ url_for('static', filename='data/cam/sat/${satImageName}.png)}}")
            .attr("width", "33vw")
            .style("opacity", 1);

        vis.wrangleData();
    }


    /*
     *  Data wrangling
     */
    wrangleData () {
        let vis = this;

        // No data wrangling/filtering needed

        // Update the visualization
        vis.updateCameraLocation();
    }

    updateCameraLocation() {
        let vis = this;

        //update sat image
        vis.svg.selectAll('image').remove();
        vis.svg.selectAll('rect').remove();
        vis.svg.selectAll('circle').remove();

        let satImageName = vis.videoData[selectedCameraNum - 1].clipName

        vis.svg
            .append("image")
            .attr("href", "https://storage.cloud.google.com/project_ac295/input/sat_images/"+satImageName+".png")
            .attr("width", "33vw");

        //Set Dataset
        vis.mwDataset = eval("mw"+selectedCameraNum+"Raw"); //we're assigning the existing dataset to this variable here, not just the name
        vis.sdDataset = eval("sd"+selectedCameraNum+"Raw");
        vis.totalFrameCount = Object.keys(vis.mwDataset.maskStats).length

        let currentSDRate =  (1-(vis.sdDataset.sdOutput.num_violation[currentFrameNumber] / vis.sdDataset.sdOutput.total_people[currentFrameNumber])).toFixed(4)
        let currentMasksWorn = vis.mwDataset.maskStats[(currentFrameNumber+1).toString()][1] + vis.mwDataset.maskStats[(currentFrameNumber+1).toString()][3] //all masks worn, correctly or incorrectly
        let currentMWRate =  (currentMasksWorn / vis.mwDataset.maskStats[(currentFrameNumber+1).toString()][0]); //based on the number of faces detected
        // let currentMWRate =  (currentMasksWorn / vis.sdDataset.sdOutput.total_people[currentFrameNumber]).toFixed(4) // based on the total number of people detected


        //update displayed statistics per quarter second
        let sdScore = (`<h4>${currentSDRate*100}%</h4><p style="font-size:1.5vh">Social Distancing</p><h4>${vis.sdDataset.sdOutput.num_cluster[currentFrameNumber]}</h4><p style="font-size:1.5vh">Clusters</p>`);
        //show previews of camera image selected
        document.getElementById("socialDistancingResults").innerHTML = sdScore;
        let mwScore = (`<h4>${currentMWRate*100}%</h4><p style="font-size:1.5vh">Mask Wearing</p>`);
        //show previews of camera image selected
        document.getElementById("maskWearingResults").innerHTML = mwScore;

        //changed camera so reset current frame number
        currentFrameNumber = 1;
        simPlay = false;


        // Sidewalk Field
        vis.svg.append("rect")
            .attr("class", "sidewalk-field")
            .transition()
            .duration(1000)
            // .style('fill', '#d2d0d0')
            .style('fill', 'white')
            .attr('stroke-width', ' 2px')
            .attr('stroke', 'red')
            .style('opacity', '0.35')
            .attr("x", vis.camData[selectedCameraNum-1].camFieldX)
            .attr("y",vis.camData[selectedCameraNum-1].camFieldY)
            .attr("height", vis.camData[selectedCameraNum-1].camFieldHeight)
            .attr("width", vis.camData[selectedCameraNum-1].camFieldWidth)


        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let currentSDRate =  (1-(vis.sdDataset.sdOutput.num_violation[currentFrameNumber] / vis.sdDataset.sdOutput.total_people[currentFrameNumber])).toFixed(4)
        let currentMasksWorn = vis.mwDataset.maskStats[(currentFrameNumber+1).toString()][1] + vis.mwDataset.maskStats[(currentFrameNumber+1).toString()][3] //all masks worn, correctly or incorrectly
        let currentMWRate =  (currentMasksWorn / vis.sdDataset.sdOutput.total_people[currentFrameNumber])

        //update displayed statistics per quarter second
        let sdScore = (`<h4>${(currentSDRate*100).toFixed(2)}%</h4><p style="font-size:1.5vh">Social Distancing</p><h4>${vis.sdDataset.sdOutput.num_cluster[currentFrameNumber]}</h4><p style="font-size:1.5vh">Clusters of People</p>`);
        //show previews of camera image selected
        document.getElementById("socialDistancingResults").innerHTML = sdScore;
        let mwScore = (`<h4>${(currentMWRate*100).toFixed(2)}%</h4><p style="font-size:1.5vh">Mask Wearing</p>`);
        //show previews of camera image selected
        document.getElementById("maskWearingResults").innerHTML = mwScore;

        let timeStampSecs = (currentFrameNumber * (1/30));
        document.getElementById("vid-timestamp-secs").innerHTML = getDigitalTimeDisplay(timeStampSecs); //in seconds
        document.getElementById("vid-timestamp-frames").innerHTML =  "Frame " + currentFrameNumber; //in frames

        //remove existing circles
        vis.svg.selectAll('circle').remove()



        console.log("???", vis.camData[selectedCameraNum-1])

        //create people animation dots
        vis.socialRadiusViolation = vis.svg.selectAll('.social-radius-violation')
            .data(vis.sdDataset.sdOutput.people_violation[currentFrameNumber])

        vis.peopleViolation = vis.svg.selectAll('.people-violation')
            .data(vis.sdDataset.sdOutput.people_violation[currentFrameNumber])

        vis.socialRadiusCompliance = vis.svg.selectAll('.social-radius-compliance')
            .data(vis.sdDataset.sdOutput.people_safe[currentFrameNumber])

        vis.peopleCompliance = vis.svg.selectAll('.people-compliance')
            .data(vis.sdDataset.sdOutput.people_safe[currentFrameNumber])


        vis.socialRadiusViolation.enter().append("circle")
            .attr('class', 'social-radius-violation')
            .attr('class', 'sdpoint')
            .attr('fill', 'red')
            .attr('opacity', '0.2')
            .attr("cx", d => (d[0] * vis.camData[selectedCameraNum-1].camScaleX))
            .attr("cy", d => (d[1] * vis.camData[selectedCameraNum-1].camScaleY))
            // .attr("cy", d => (d[0]*(vis.camData[selectedCameraNum-1].camScaleX))+(vis.camData[selectedCameraNum-1].camFieldX)+(vis.camData[selectedCameraNum-1].camOffsetX))
            // .attr("cx", d => -(d[1]*(vis.camData[selectedCameraNum-1].camScaleY))+(vis.camData[selectedCameraNum-1].camFieldY)+(vis.camData[selectedCameraNum-1].camOffsetY))
            .attr("r", 16)

        vis.peopleViolation.enter().append("circle")
            .attr('class', 'people-violation')
            .attr('class', 'sdpoint')
            .on('mouseover', function(event, d){  /// TOOLTIP FUNCTIONALITY
                d3.select(this)
                    .attr('stroke-width', ' 2px')
                    .attr('stroke', 'black')
                    .style('fill', 'white')
                    .style("opacity", '0.60')

                vis.tooltip
                    .style("opacity", 0.89)
                    .style("left", event.pageX + 20 + "px"  )
                    .style("top", event.pageY + "px")
                    .html(`
                             <div style="border: thin solid #c6c6c6; width: 110%; border-radius: 5px; background: #000000; padding: 10px; text-align: left">
                                 <h6 style="color:red">Person NOT Socially Distancing</h6>
                             </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .style('fill', 'red')
                    .style("opacity", 1)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``)
            })
            .attr('fill', 'red')
            .attr("cx", d => (d[0] * vis.camData[selectedCameraNum-1].camScaleX))
            .attr("cy", d => (d[1] * vis.camData[selectedCameraNum-1].camScaleY))
            // .attr("cy", d => (d[0]*(vis.camData[selectedCameraNum-1].camScaleX))+(vis.camData[selectedCameraNum-1].camFieldX)+(vis.camData[selectedCameraNum-1].camOffsetX))
            // .attr("cx", d => -(d[1]*(vis.camData[selectedCameraNum-1].camScaleY))+(vis.camData[selectedCameraNum-1].camFieldY)+(vis.camData[selectedCameraNum-1].camOffsetY))
            .attr("r", 4)

        vis.socialRadiusCompliance.enter().append("circle")
            .attr('class', 'social-radius-compliance')
            .attr('class', 'sdpoint')
            .attr('fill', 'green')
            .attr('opacity', '0.3')
            .attr("cx", d => (d[0] * vis.camData[selectedCameraNum-1].camScaleX))
            .attr("cy", d => (d[1] * vis.camData[selectedCameraNum-1].camScaleY))
            // .attr("cy", d => (d[0]*(vis.camData[selectedCameraNum-1].camScaleX))+(vis.camData[selectedCameraNum-1].camFieldX)+(vis.camData[selectedCameraNum-1].camOffsetX))
            // .attr("cx", d => -(d[1]*(vis.camData[selectedCameraNum-1].camScaleY))+(vis.camData[selectedCameraNum-1].camFieldY)+(vis.camData[selectedCameraNum-1].camOffsetY))
            .attr("r", 16)

        vis.peopleCompliance.enter().append("circle")
            .attr('class', 'people-compliance')
            .attr('class', 'sdpoint')
            .on('mouseover', function(event, d){  /// TOOLTIP FUNCTIONALITY
                d3.select(this)
                    .attr('stroke-width', ' 2px')
                    .attr('stroke', 'black')
                    .style('fill', 'white')
                    .style("opacity", '0.60')

                vis.tooltip
                    .style("opacity", 0.89)
                    .style("left", event.pageX + 20 + "px"  )
                    .style("top", event.pageY + "px")
                    .html(`
                             <div style="border: thin solid #c6c6c6; width: 110%; border-radius: 5px; background: #000000; padding: 10px; text-align: left">
                                 <h6 style="color:green">Person Socially Distancing!</h6>
                             </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .style('fill', 'green')
                    .style("opacity", 1)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``)
            })
            .attr('fill', 'green')
            .attr("cx", d => (d[0] * vis.camData[selectedCameraNum-1].camScaleX))
            .attr("cy", d => (d[1] * vis.camData[selectedCameraNum-1].camScaleY))
            // .attr("cy", d => (d[0]*(vis.camData[selectedCameraNum-1].camScaleX))+(vis.camData[selectedCameraNum-1].camFieldX)+(vis.camData[selectedCameraNum-1].camOffsetX))
            // .attr("cx", d => -(d[1]*(vis.camData[selectedCameraNum-1].camScaleY))+(vis.camData[selectedCameraNum-1].camFieldY)+(vis.camData[selectedCameraNum-1].camOffsetY))
            .attr("r", 4)


        vis.svg.append("circle")
            .attr('class', 'cam-dot')
            .on('mouseover', function(event, d){  /// TOOLTIP FUNCTIONALITY
                d3.select(this)
                    .attr('stroke-width', ' 2px')
                    .attr('stroke', 'black')
                    .style('fill', 'white')
                    .style("opacity", '0.60')

                vis.tooltip
                    .style("opacity", 0.89)
                    .style("left", event.pageX + 20 + "px"  )
                    .style("top", event.pageY + "px")
                    .html(`
                             <div style="border: thin solid #c6c6c6; width: 110%; border-radius: 5px; background: #000000; padding: 10px; text-align: left">
                                 <h6 style="color:yellow">Camera Location</h6>
                             </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .style('fill', 'yellow')
                    .style("opacity", 1)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``)
            })
            .attr('fill', 'yellow')
            .attr("cy", vis.camData[selectedCameraNum-1].cameraDotY)
            .attr("cx", vis.camData[selectedCameraNum-1].cameraDotX)
            .attr("r", 10)


        //adjust and scale location based on satellite image
        vis.svg.selectAll('.sdpoint')
            .attr('transform', 'translate('+vis.camData[selectedCameraNum-1].camOffsetX+','+vis.camData[selectedCameraNum-1].camOffsetY+'), rotate('+vis.camData[selectedCameraNum-1].camFieldRotation+')');


    }

}

