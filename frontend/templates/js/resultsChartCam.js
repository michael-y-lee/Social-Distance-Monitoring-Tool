class ResultsChartCamera {

    /*
     *  Constructor method
     */
    constructor(_parentElement, _cameraData, _socDistData, _maskData) {
        this.parentElement = _parentElement;
        this.camData = _cameraData;
        this.sdData = _socDistData;
        this.maskData = _maskData;

        this.initVis();
    }

    /*
     *  Initialize camera street map
     */
    initVis () {
        let vis = this;

        //create the variable names
        vis.mwDataset = eval("mw"+selectedCameraNum+"Raw");
        vis.sdDataset = eval("sd"+selectedCameraNum+"Raw");
        vis.totalFrameCount = Object.keys(vis.mwDataset.maskStats).length

        vis.margin = {top: 5, right: 0, bottom: 35, left: 40};
        vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $('#' + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        // Scales and axes
        vis.x = d3.scaleLinear()
            .range([0, vis.width])
            .domain([0,vis.totalFrameCount]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0])

        console.log("MaxyMax",vis.sdDataset.sdOutput.total_people);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            // .ticks(4);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "y-axis chart-axis")

        vis.svg.append("g")
            .attr("class", "x-axis chart-axis")
            .attr("transform", "translate(0," + vis.height + ")");

        // add axis labels
        vis.svg.append('g')
            .attr('class', 'x-axis axis-title')
            .append('text')
            .text("Frame Number")
            .attr('transform', `translate(${vis.width/2}, ${vis.height+30})`)
            .attr('text-anchor', 'middle');

        // add axis labels
        vis.svg.append('g')
            .attr('class', 'y-axis axis-title')
            .append('text')
            .text("People")
            .attr('transform', `translate(${-25}, ${(vis.height/2)-10}) rotate(-90)`)
            .attr('text-anchor', 'middle');

        ////////// CREATE TOOLTIP //////////////////
        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'chartToolTip')

        vis.wrangleData();
    }


    /*
     *  Data wrangling
     */
    wrangleData () {
        let vis = this;

        //Update the variable names
        vis.mwDataset = eval("mw"+selectedCameraNum+"Raw"); //we're assigning the existing dataset to thsi variable here, not just the name
        vis.sdDataset = eval("sd"+selectedCameraNum+"Raw");
        vis.totalFrameCount = Object.keys(vis.mwDataset.maskStats).length

        console.log("EEEEEEEEEEEEEEEEEEEE", vis.mwDataset, vis.sdDataset);

        // console.log("Raw Mask Stats!", vis.mwDataset.maskStats["1"][3]);
        // console.log("Raw SD Stats!", vis.sdDataset.sdOutput);


        // console.log("Raw SD Stats Total!", vis.sdDataset.sdOutput.total_people[1]);
        // console.log("Raw SD Stats Violate!", vis.sdDataset.sdOutput.num_violation[1]);
        // console.log("Raw SD Stats Safe!", vis.sdDataset.sdOutput.num_safe[1]);


        // vis.testThis = vis.sdDataset.sdOutput.total_people;
        // console.log("???", vis.testThis);
        //
        // vis.testThis = Array.from(d3.group(vis.sdDataset.sdOutput, d =>d.total_people), ([key, value]) => ({key, value}))
        //
        // console.log("???", vis.testThis);



        //MASK WEARING INPUT
        // each key is the frame number and the value is a 4 element list.
        //     element1: total number of bounding boxes
        //     element2:
        //     element3: number of people not wearing masks
        //     element4: number of people improperly wearing masks

        vis.totalPeopleByFrame = [];
        vis.sdviolationsByFrame = [];
        vis.properMaskWearByFrame = [];
        vis.improperMaskWearByFrame = [];
        vis.noMaskWearByFrame = [];

        //loop over data and append into arrays for plotting
        for (let i = 0; i < vis.totalFrameCount; i++) {
            vis.totalPeopleByFrame.push(vis.sdDataset.sdOutput.total_people[i])
            vis.sdviolationsByFrame.push(vis.sdDataset.sdOutput.num_violation[i])
            vis.properMaskWearByFrame.push(vis.mwDataset.maskStats[(i+1).toString()][1]) //number of masks
            vis.improperMaskWearByFrame.push(vis.mwDataset.maskStats[(i+1).toString()][3]) //number of people improperly wearing masks
            vis.noMaskWearByFrame.push(vis.totalPeopleByFrame[i] - vis.properMaskWearByFrame[i] - vis.improperMaskWearByFrame[i])
        }


        console.log(vis.improperMaskWearByFrame)

        //sum
        console.log(vis.improperMaskWearByFrame.reduce((a,b) => a + b, 0));

        // Update the visualization
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.y.domain([0, d3.max(vis.totalPeopleByFrame)]);
        vis.x.domain([0, vis.totalFrameCount]);

        vis.svg.selectAll("path").remove();

        // Calculate the area fill
        vis.area_total_people = d3.area()
            .curve(d3.curveCardinal)
            .x(function(d,i) { return vis.x(i); })
            .y0(vis.height)
            .y1(function(d,i) { return vis.y(d); });
        vis.svg.append("path")
            .datum(vis.totalPeopleByFrame)
            .attr("class", "area-fill")
            .on('mouseover', function(event, d){  /// TOOLTIP FUNCTIONALITY
                d3.select(this)
                    .attr('stroke-width', ' 2px')
                    .attr('stroke', 'black')
                    .style('fill', 'blue')
                    .style("opacity", '0.60')

                vis.tooltip
                    .style("opacity", 0.89)
                    .style("left", event.pageX + 20 + "px"  )
                    .style("top", event.pageY + "px")
                    .html(`
                                 <div style="border: thin solid #c6c6c6; width: 110%; border-radius: 5px; background: #000000; padding: 10px; text-align: left">
                                     <h6 style="color:white">People Properly Socially Distancing</h6>
                                 </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .style('fill', 'cornflowerblue')
                    .style("opacity", 1)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``)
            })
            .style('fill', 'cornflowerblue')
            .style('opacity', 1)
            .attr("d", vis.area_total_people);

        vis.peopleInSDiolation = d3.area()
            .curve(d3.curveCardinal)
            .x(function(d,i) { return vis.x(i); })
            .y0(vis.height)
            .y1(function(d,i) { return vis.y(d); });
        vis.svg.append("path")
            .datum(vis.sdviolationsByFrame)
            .attr("class", "area-fill")
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
                                     <h6 style="color:white">People <b>NOT</b> Properly Socially Distancing</h6>
                                 </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .style('fill', '#b7b5b5')
                    .style("opacity", 1)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``)
            })
            .style('fill', '#b7b5b5')
            .style('opacity', 1)
            .attr("d", vis.peopleInSDiolation);

        vis.improperlyWearingMask = d3.area()
            .curve(d3.curveCardinal)
            .x(function(d,i) { return vis.x(i);})
            .y0(vis.height)
            .y1(function(d,i) { return vis.y(d);});
        vis.svg.append("path")
            .datum(vis.improperMaskWearByFrame)
            .attr("class", "area-fill")
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
                                     <h6 style="color:white">People <b>Incorrectly</b> Wearing a Mask</h6>
                                 </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .style('fill', 'yellow')
                    .style("opacity", 0.90)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``)
            })
            .style('fill', 'yellow')
            .style('opacity', 0.90)
            .attr("d", vis.improperlyWearingMask);

        vis.wearingMask = d3.area()
            .curve(d3.curveCardinal)
            .x(function(d,i) { return vis.x(i); })
            .y0(vis.height)
            .y1(function(d,i) { return vis.y(d); });
        vis.svg.append("path")
            .datum(vis.properMaskWearByFrame)
            .attr("class", "area-fill")
            .on('mouseover', function(event, d){  /// TOOLTIP FUNCTIONALITY
                d3.select(this)
                    .attr('stroke-width', ' 2px')
                    .attr('stroke', 'black')
                    .style('fill', 'orange')
                    .style("opacity", '0.60')

                vis.tooltip
                    .style("opacity", 0.89)
                    .style("left", event.pageX + 20 + "px"  )
                    .style("top", event.pageY + "px")
                    .html(`
                                 <div style="border: thin solid #c6c6c6; width: 110%; border-radius: 5px; background: #000000; padding: 10px; text-align: left">
                                     <h6 style="color:white">People Wearing a Mask</h6>
                                 </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .style('fill', 'orangered')
                    .style("opacity", 1)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``)
            })
            .style('fill', 'orangered')
            .style('opacity', 1)
            .attr("d", vis.wearingMask);


        // Update the x-axis
        vis.svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(vis.xAxis);

        // Update the y-axis
        vis.svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(vis.yAxis);
    }

}

