(function() { //Wrapped to protect global variables

//===================================================
//Global setup
//===================================================
vis = {};

//Dimensions / Size
var margin, margin2, spacing, width, mainHeight, miniHeight;
var lanePadding;   //Between 0 and 1

var beginTime, endTime;

//Tools
var dateParser;
var dateDisplayer;

//Data
var types;
var laneindex;
var totalLanes;
var focalType;
var childtypes;

//Globals
var grayed      = false;
var highlightID = "";
var minfont     = 0;
//----------------------------------------------------------------
// Laneindex[] holds the absolute address of each main lane
// where address = the sum of all preceding sublanes)
//Eg:
//0----    <---laneindex[0] = 0
//  0.1
//  0.2
//  0.3
//1----    <---laneindex[1] = 4
//  1.1 
//  1.2
//2----    <---laneindex[0] = 7 , eg
//  2.1
//  2.2
//----------------------------------------------------------------

//===================================================
//Initialization
//===================================================
vis.init = function(params,json) {
  // code for init function ... 
  margin        = {top: 10, right: 30, bottom: 100, left: 60};
  margin2       = {top: 10, right: 30, bottom: 20, left: 60};

  spacing       = params.spacing || 50;

  width         = (params.width       || 1100) - margin.left - margin.right;
  mainHeight    = (params.mainHeight  || 500)  - margin.top  - margin.bottom;
  miniHeight    = (params.miniHeight  || 70)   - margin2.top - margin2.bottom;

  d3.select("#collapse").style('width', width);

  lanePadding   = params.lanePadding || 0.35;

  types         = params.types;
  focalType     = params.focal;

  childtypes    = types.filter(function(d){return d != focalType;});
  dateParser    = d3.time.format(params.dateFormat).parse;
  // dateDisplayer = d3.time.format("%x %X");
  dateDisplayer = d3.time.format("%c");
  vis.loaddata(params,json);
};


//===================================================
//Load data
//===================================================
vis.loaddata = function(params,json) {
  // code for loading data ...

  //JSON may contain duplicate values
  var uniqueJSON = [];

  json.forEach(function(d){
    d.startdate    = dateParser(d.startdate);
    d.enddate      = dateParser(d.enddate);
    d.lane         = types.indexOf(d.type);

    //Set x axis range
    if ( typeof beginTime === 'undefined' || d.startdate < beginTime ) beginTime = d.startdate;
    if ( typeof endTime   === 'undefined' || d.enddate  > endTime    ) endTime   = d.enddate;
    
    // //Offset start end date by one day
    // beginTime = d3.time.day.offset(beginTime,-1);
    // endTime = d3.time.day.offset(endTime,1);

    d.link.forEach(function(dd) {
      if(typeof dd.time != "undefined") {
        dd.time = dateParser(dd.time);
      }
    });
  
   if(uniqueJSON.filter(function (e){ return e.id === d.id;}).length > 0 ){
    //element already exists, ignore
   } 
   //push to unique set
   else uniqueJSON.push(d);
  });

    json = uniqueJSON;
    //Assign a sublane to each type so no overlaps
    var index = 0,
        sublanes;
    
    laneindex = [];
    types.forEach(function(type){
      laneindex.push(index);
      var filtered = json.filter(function(d){ if( d.type === type) return d;});
        //sortSublanes() function adds the sublane field to each type and returns the number of sublanes in a lane
        sublanes = sortSubLanes(filtered);
        //We need this to keep track of where each lane begins
        index += sublanes;
    });

    totalLanes = laneindex[laneindex.length - 1] + sublanes;
    params.data = json;
    vis.draw(params);

  //----------------------------------------------------------
  // sortSubLanes sorts an array of entries into sublanes, such that no entry has an overlaping
  // start/stop time. Algorithm adopted from slide 16 here:
  // http://people.cs.umass.edu/~sheldon/teaching/mhc/cs312/2013sp/Slides/Slides08%20-%20IntervalScheduling.pdf 
  // @return: The number of sublanes 
  // ----------------------------------------------------------
  function sortSubLanes(unfiltered){

      unfiltered.sort(function(a,b){
        if (a.startdate < b.startdate) {return -1;}
        if (a.startdate > b.startdate) {return  1;}
        return 0;
      });

      var laneCount = 0;
      var filtered = [];
      unfiltered.forEach(function(d){

        //check if d is compatible with some lane i <= laneCount
        //if so, add it to lane i. If not, increase lane count and continue

      for(var i = 0; i <=laneCount; i++){
          var laneOccupants = filtered.filter(function(d){ if(d.sublane === i) return d;});

          if(isCompatibile(d,laneOccupants)) {
            d.sublane = i;
            filtered.push(d);
            break;
          }
        }
        //Sublane hasn't been assigned, therefore increase lanecount
        if(typeof d.sublane === "undefined") {
          d.sublane = ++laneCount;
          filtered.push(d);
        }
      });
        //This will be used to calculate the index of each lane. +1 to account for 0 index.
        return (laneCount + 1);
    }

  // ----------------------------------------------------------
  // isCompatible checks a sublane to see if a new entry (newbie) can be slotted
  // into the sublane without overlapping any existing entries
  // ----------------------------------------------------------

  function isCompatibile(newbie, occupants){
    if(occupants.length ===0) return true;
    //check incompatibility for each occupant in the lane
    for (var i = 0; i < occupants.length; i++) {
        if((newbie.startdate >= occupants[i].startdate && newbie.startdate < occupants[i].enddate) ||
         (newbie.enddate < occupants[i].enddate && newbie.enddate >= occupants[i].startdate)) {
           return false;
        }
    }
    //No conflicts
    return true;
  } 

  };

//===================================================
//Draw timeline
//===================================================
vis.draw = function(params) {

    // code for drawing stuff ...

    //Total lanes = position of last index + sublanes
    var minibarHeight = (miniHeight / totalLanes) * (1 - lanePadding);

//---------------------------------------------------
//Set the stage
//---------------------------------------------------
    //timeline
    d3.select("#chart").style('position', 'relative');

    var svg1 = d3.select("#chart").append("svg")
        .attr("font", '10px sans-serif')
        .attr("width", width + margin.left + margin.right)
        .attr("height", (mainHeight + margin.top + margin.bottom + spacing));

    var tooltip = d3.select("#chart").append("div")
        .attr("class", "tooltip")
        .style("font", "10px 'Helvetica'")
        .style('opacity', 0);

    var defs = svg1.append("defs");
          defs.append("clipPath")
            .attr("id", "clip")
          .append("rect")
            .attr("width", width)
            .attr("height", mainHeight);

    //---------------------------------------------------
    //Markers for arrows
    //---------------------------------------------------

    // Arrowhead
    // https://gist.github.com/satomacoto/3384995
    defs.append("svg:marker")
        .attr("class", "arrowHead")
        .attr("id", "arrow")
        .attr("viewBox","0 0 10 10")
        .attr("refX","8.2")
        .attr("refY","5")
        .attr("markerUnits","strokeWidth")
        .attr("markerWidth","9")
        .attr("markerHeight","5")
        .attr("orient","auto")
      .append("svg:path")
       .attr("d","M 0 0 L 10 5 L 0 10 z");

    // Circle for endpoint
    defs.append("svg:marker")
      .attr({
          id: 'circle',
          markerWidth: 8,
          markerHeight: 8,
          refX: 5,
          refY: 5
      })
      .append('circle')
        .attr({
          cx: 5,
          cy: 5,
          r: 1.2,
          'class': 'circleMarker'
        }); 


    //Main timeline
    var main = svg1.append("g")
        .attr("class", "main")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", width)
        .attr("height", mainHeight);
    


    //Mini timeline
    var mini = svg1.append("g")
        .attr("class", "mini")
        .attr("transform", "translate(" + margin.left + "," + (mainHeight + margin.top + spacing) + ")") 
        .attr("width", width)
        .attr("height", miniHeight);

    //Translate details section by margin left to align
    //Use jquery because d3 doesn't translate divs
    $(".details").css({
      left: margin.left,
      position:'relative',
      width: width
    });

    //Time scales
    var x  = d3.time.scale().range([0, width]).domain([beginTime, endTime]),
        x2 = d3.time.scale().range([0, width]).domain([beginTime, endTime]),
        y  = d3.scale.linear().range([ 0, mainHeight]).domain([0, totalLanes]),
        y2 = d3.scale.linear().range([ 0, miniHeight]).domain([0, totalLanes]);

//----------------------------  
// Axes
//----------------------------   

    var xAxisMain = d3.svg.axis().scale(x).orient("bottom").tickSize(-mainHeight);
        xAxisMini = d3.svg.axis().scale(x2).orient("bottom"); //Min graph axis is fixed, main changes depending on selection
        yAxisMain = d3.svg.axis().scale(y).orient("left");
        yAxisMini = d3.svg.axis().scale(y2).orient("left"); 

    var customTimeFormat = d3.time.format.multi([
      [".%L",   function(d) { return d.getMilliseconds(); }],
      [":%S",   function(d) { return d.getSeconds(); }],
      ["%I:%M", function(d) { return d.getMinutes(); }],
      ["%I %p", function(d) { return d.getHours(); }],
      ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
      ["%b %d", function(d) { return d.getDate() != 1; }],
      ["%b",    function(d) { return d.getMonth(); }],
      ["%Y",    function() { return true; }]
    ]);

    xAxisMain.tickFormat(customTimeFormat);
    xAxisMini.tickFormat(customTimeFormat);

      // main x axis
      main.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + mainHeight + ")")
          .call(xAxisMain);

      //mini x axis
      mini.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (miniHeight) + ")")
          .call(xAxisMini);

//----------------------------
//Description panel
//----------------------------
  var svg2 = d3.select("#details").append("svg")
        .attr("font", '10px sans-serif')
        .attr("width",width + margin.left + margin.right)
        .attr("height", mainHeight);

        svg2.append("defs")
        .append("clipPath")
          .attr('id',"clip")
        .append("rect")
          .attr('width', width)
          .attr('height', mainHeight);

  var description = svg2.append("g")
        .attr("class", "description")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", width)
        .attr("height", mainHeight);

//--------------------------
//D3 Sugar
//--------------------------
      //Zoom
      var zoom = d3.behavior.zoom()
        .x(x).y(y)
        .scaleExtent([1, 100])
        .on("zoom", zoomed);

       //Brush
      var brush = d3.svg.brush()
        .x(x2)
        .y(y2)
        .extent([[x2.domain()[0],y2.domain()[0]],[x2.domain()[1],y2.domain()[1]]])
        .on("brush", brushed);


      //Line maker
      //Pass array of x,y points to draw polyline
      var line = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

                 
//--------------------------
//Assemble
//--------------------------
      var zoomarea = main.append("rect")
          .attr("id"    , "zoomspace")
          .attr("style" , "opacity:0")
          .attr("width" , width)
          .attr("height", mainHeight)
          .call(zoom)
          .on("mousemove",function(d){ zoom.center(d3.mouse(this));});
          //This resets the zoom focal point to be relative to the zoom area again
          //Normally not needed but because we translate the <g> for each bar the mouse 
          //position gets reset 

      var itemRects = main.append("g")
          .attr('id', "rectspace")
          .attr("clip-path", "url(#clip)");

      //Groups allow us to order the paths, rects, and labels
      
      var pathGroup   = itemRects.append("g")
          .attr('id', "paths");
          
      var circleGroup= itemRects.append("g")
          .attr('id', "circles");
     
      var barGroup   = itemRects.append("g")
          .attr('id', "bars");

      mini.append("g").selectAll("miniItems")
          .data(params.data)
          .enter().append("rect")
          .attr("class" ,function(d) {return "minibar " + "bar" + (types.indexOf(d.type)%6);})
          .attr("id" ,   function(d) {return "mini" + d.id;})
          .attr("x"     ,function(d) {return x(d.startdate);})
          .attr("y"     ,function(d) {return y2(laneindex[d.lane] + d.sublane);})
          .attr("width" ,function(d) {return x(d.enddate) - x(d.startdate);})
          .attr("height",(minibarHeight));

     var brushNode = mini.append("g")
          .attr("class", "brush")
          .call(brush);

    // // Set the brush to non-clickable
    brushNode.selectAll("rect")
      .style("pointer-events","none");

      brushed();

//--------------------------------------------------------
//Brushed function is called when user moves brush. Zoom function calls brush function
//--------------------------------------------------------
    function brushed() {
        var e  = brush.extent(),
            xextent = [e[0][0], e[1][0]],
            yextent = [e[0][1], e[1][1]];

        x.domain(brush.empty() ? x2.domain() : xextent);
        y.domain(brush.empty() ? y2.domain() : yextent);

        main.select(".x.axis").call(xAxisMain);
        main.select(".y.axis").call(yAxisMain);


        var rects, labels, paths;
            minXExtent = xextent[0];
            maxXExtent = xextent[1];
            minYExtent = yextent[0];
            maxYExtent = yextent[1];

        var visItems = params.data.filter(function(d) {
              return d.startdate < maxXExtent &&  
                     d.enddate > minXExtent &&
                     (laneindex[d.lane] + d.sublane) <= Math.ceil(maxYExtent) &&
                     (laneindex[d.lane] + d.sublane) >= Math.floor(minYExtent);}); //Grab only items in brush window

            mini.select(".brush")
               .call(brush.extent(e));

        var barHeight = y(1 - lanePadding) - y(0);

        //These pixels scale with zoom
        var zoompix   = function(x){return x*zoom.scale();};

        //Set minimum fontsize 
        if(minfont === 0) minfont = barHeight / 3;

        var bars = barGroup.selectAll("g")
        //Update bars
             .data(visItems, function(d) {return d.id;})
             .attr("transform", function(d){ return "translate("+ x(d.startdate) +"," + y(laneindex[d.lane] + d.sublane) + ")";} )
             .each(function(d) {
                var bar = d3.select(this);
                bar.select("rect")
                  .attr("width" , function() {return x(d.enddate) - x(d.startdate);})
                  .attr("height", function() {return barHeight;});
                bar.select("text")
                  .attr("x", 3)
                  .attr("y", (barHeight/3))
                  // .attr("font-size"  , function() {

                  //   var fontsize  = d3.select(this).attr("font-size");
                  //   var fontnum   = parseFloat(fontsize.substring(0,fontsize.length - 2));
                  
                  //   var displayed = d3.select(this).text();
                    
                  //   if(displayed === d.title ){
                  //     return (barHeight * d.scale);
                  //   } 

                  //   else {
                  //     // truncateBarText(bar, d.title);
                  //     var rectheight = bar.select("rect").node().getBBox().height;
                  //     d.scale = (fontnum / rectheight);
                  //     return fontsize;
                  //   }
                  // });
                  .attr("font-size"  , barHeight/3);


              });
        //Add new bars
             bars.enter().append("g")
               .attr("class" ,    function(d) {return "bar" + (types.indexOf(d.type)%6);})
               .attr("id"    ,    function(d) {return d.id;})
               .attr("transform", function(d) {return "translate("+ x(d.startdate) +"," + y(laneindex[d.lane] + d.sublane) + ")";} )
               .attr("width" ,    function(d) {return x(d.enddate) - x(d.startdate);})
               .attr("height",    function(d) {return barHeight;})
               // .attr("filter", "url(#clippy)")
               .each(function(d) {
                  //text ratio compared to barheight
                  d.scale = 1/3;
                  var bar = d3.select(this);
                  var barWidth = x(d.enddate) - x(d.startdate);
                  bar.append("rect")
                    .attr("width" , barWidth)
                    .attr("height", barHeight)
                    .attr("id"    ,function(d) {return d.id;})
                    .classed("whiteout", function(d){
                      if(highlightID === "" || highlightID === d.id) return false;
                      else return true;
                    });
                  bar.append("text")
                    .attr("font-size"  , barHeight * d.scale + "px")
                    .attr("text-anchor", "start")
                    .attr('fill', "white")
                    .attr("x", 3)
                    .attr("y", (barHeight * d.scale));
                    
                   truncateBarText(bar, d.title);      
                  });

              //Add functionality for bars
              bars.call(zoom).on("dblclick.zoom", null)
                .on("mousemove",function(d){ 
                  //This resets the zoom focal point to be relative to the zoom area again
                  var mouse = d3.mouse(this);
                  var t = d3.transform(d3.select(this).attr("transform")),
                      x = t.translate[0],
                      y = t.translate[1];
                  var focal = [mouse[0]+x, mouse[1]+y];
                  zoom.center(focal);
                })
                .on("click"     , handleClick())
                .on("mouseover" , showLine())
                .on("mouseout"  , hideLine());

              bars.exit().remove();

//------------------------------
//Each datapoint in pathData
// "startY"   : startY,
// "endY"     : endY,
// "time"     : d.time,
// "fromNode" : fromNode,
// "toNode"   : toNode,
// "id"       : id,
//------------------------------
         var pathData = getPathData();

               paths = pathGroup.selectAll("path")
                    .data(pathData, function(d) { return d.id; })
                    .attr("stroke-width", barHeight/6)
                    .attr('d', makeline());
                   paths.enter().append("path")
                    .attr('class', 'parentline')
                    .attr('id', function(d) { return "from" + d.fromNode.id;} )
                    .attr('d', makeline())
                    .attr("stroke-width", barHeight/6)
                    .attr("marker-start", "url(#circle)")
                    .attr("marker-end", "url(#arrow)")
                    .call(zoom)
                    .on("mouseover", function(d){
                      tooltip.html(dateDisplayer(d.time));
                      tooltip.transition().style('opacity', 0.9);
                    })
                    .on("mouseout",function(d) {
                      tooltip.transition().style('opacity', 0);
                    });

              
               paths.exit().remove();

               circles = circleGroup.selectAll("circle")
                    .data(pathData, function(d) { return d.id; })
                      .attr('cx', function(d) {return x(d.time);})
                      .attr('cy', function(d) {return d.startY;})
                      .attr('r',  function(d) {return barHeight/20;});
                    circles.enter().append('circle')
                      .attr("class", "innercircle")
                      .attr('id', function(d) { return "from" + d.fromNode.id;} )
                      .attr('cx', function(d) {return x(d.time);})
                      .attr('cy', function(d) {return d.startY;})
                      .attr('r',  function(d) {return barHeight/20;});
                    circles.exit().remove();


//---------------------------------------
//Functions to handle lines that show 
//relationship between parent and child
//---------------------------------------

    function truncateBarText(bar,title){
      var text = bar.select("text").text(title);

      var rectwidth = bar.select("rect").node().getBBox().width;
      var textwidth = bar.select("text").node().getBBox().width;
      
      if(textwidth < (rectwidth-15)) return;

      var len   = title.length;

      if(len < 4 ) {
        bar.select("text").text("");
        return;
      }
      //Remove 4 characters and add three dots
      var truncated  = title.substring(0,len - 4) + "...";
     
      //recursive call;
      truncateBarText(bar, truncated);
    }


    function getPathData(){

      var pathData = [];
        params.data.forEach(function (d) {
          d.link.forEach(function(dd) {
              //Time not valid, skip over link entry
              if(typeof dd.time === "undefined") return;
            
              var fromNode = getEntryById(params.data, d.id);
              var toNode   = getEntryById(params.data, dd.target);
              
              //Id not valid, skip over link entry
              if (typeof fromNode === "undefined" || typeof toNode === "undefined") return;

              var startY = y(laneindex[fromNode.lane] + fromNode.sublane);
              var endY   = y(laneindex[toNode.lane]   + toNode.sublane);

              //Arrow points downwards, therefore start at bottom of bar and end at top
              if(startY < endY) {
                startY += barHeight;
                //This is needed because of position of marker at end of line
                endY   -= barHeight/8; 
              }

              //Arrow points up, therefore end at bottom of bar  
              else {
                endY += barHeight + barHeight/8; 
              }

              var entry = {
                "startY":startY,
                "endY":endY,
                "time":dd.time,
                "fromNode":fromNode,
                "toNode":toNode,
                "id"    :fromNode.id + "_" + toNode.id
              };
             pathData.push(entry);

          });
       });

      return pathData;
    }

    function handleClick(){
      return function(d){

        //-------------------
        //Handle highlighing
        //-------------------
          if(highlightID === "" ){

            //Grab all bars but selected one
            var mainBars = d3.selectAll("#bars rect, .minibar").filter(function(bar){return bar.id != d.id ;});
            mainBars.transition().duration(100).style('opacity', 0.3);

            d3.select("#" + d.id).on("mouseout",null);

            // //Hide all paths but selected
            // d3.selectAll(".link:not(#from"+d.id+")").style("opacity", 0.2);

            highlightID = d.id;

          }
          else if (highlightID != d.id) {

            //Switch opacity of previously highlighted and selected
            d3.selectAll("#" + d.id + " rect, #mini" + d.id ).style('opacity', 1).classed("whiteout",false);
            d3.selectAll("#" + highlightID + " rect, #mini" + highlightID ).style('opacity', 0.3);

            d3.select("#" + d.id).on("mouseout",null);
            d3.select("#" + highlightID).on("mouseout",hideLine());

            d3.selectAll("#from" + d.id).style("opacity", 1);
            d3.selectAll("#from" + highlightID).style("opacity", 0.05);
            

            highlightID = d.id;

          }

          else{
            //return opacity
            var all = d3.selectAll("#bars rect, .minibar").classed("whiteout",false);
            all.transition().duration(100).style('opacity', 1);

            d3.select("#" + highlightID).on("mouseout",hideLine());
            highlightID = "";
          }
          
        //-------------------
        //Handle details pane
        //-------------------
        
          var details = $('#collapse'); 
          var prev_caller = details.attr("callerid");
          if( prev_caller === d.id || $(details).css("display") == "none"){
            details.html(makeHTML(d));
            $(details).toggle(300,"swing", function(){});
            details.attr('callerid',d.id);
          }
          else if(prev_caller != d.id){
              details.html(makeHTML(d));
              details.attr('callerid',d.id);
          }
      };
    }

    function makeline(){ 
      return function(d){
          var coordinates = [{"x": x(d.time), "y": d.startY},
                             {"x": x(d.time), "y": d.endY}];
          return line(coordinates);
         };
      }

    function showLine(){
      return function(d){
        if(highlightID === "" || highlightID === d.id){
          d3.selectAll("#from" + d.id)
              .transition().duration(75)
              .style('opacity',1);
           }
          };
      }  

    function hideLine(){

      return function(d){
        if(highlightID === "" || highlightID != d.id){
          d3.selectAll("#from" + d.id)
            .transition().duration(75)
            .style('opacity',0.05);
        }
      };
    }

    function makeHTML(d){

      var html =   "<strong>Title: </strong>"        + d.title       + "<br>" + 
                   "<strong>Type </strong>: "        + d.type        + "<br>" +
                   "<strong>Subtitle </strong>: "    + d.subtitle    + "<br>" +
                   "<strong>Start </strong>: "       + d.startdate   + "<br>" +
                   "<strong>Description </strong>: " + d.description + "<br>"; 
      return html;
 
  }
}

//----------------------------------------------------------
//Zoomed function is called when user zooms in. Zoom adjusts 
//the brush and calls brush function, where the action happens.
//----------------------------------------------------------

   function zoomed() {

      var t = zoom.translate(),
      s = zoom.scale();
      //prevent translation/zoom from exceeding bounds
      tx = Math.min(0, Math.max(width * (1 - s), t[0]));
      ty = Math.min(0, Math.max(mainHeight * (1 - s), t[1]));

      zoom.translate([tx, ty]);
      main.select(".x.axis").call(xAxisMain);
      main.select(".y.axis").call(yAxisMain);

      //update brush and redraw
      var x0 = x.domain()[0],
          x1 = x.domain()[1],
          y0 = y.domain()[0],
          y1 = y.domain()[1];

      brush.extent([[x0,y0],[x1,y1]]);
      brush(d3.select(".brush"));
      brush.event(d3.select(".brush"));
      // console.log(zoom.translate());
   }
  
  };

//==================================================================
// Helper functions
//==================================================================

  function getEntryById(data, id){
      var filter = data.filter(function(d) {return d.id === id;});
      if(filter.length === 1) return filter[0];
      else return undefined;
  }

})();


//JSON FORMAT

/*"type": "eacr",
  "id": "E51325",
  "title": "Title",
  "subtitle": "Subtitle",
  "description": "Description",
  "startdate": "2005-09-14 09:40:22",
  "enddate": "2006-09-14 09:40:22",
  "link" : { 
    "target": "targetID",
    "time": "dateStamp",
  }


    //Large dimensions
  // margin     = {top: 20, right: 30, bottom: 100, left: 60},
  // margin2    = {top: 430, right: 30, bottom: 15, left: 60},

  // spacing    = 75;
      
  // width      = 1200 - margin.left - margin.right,
  // mainHeight = 750 - margin.top - margin.bottom;
  // miniHeight = 500 - margin2.top - margin2.bottom;

  //Small dimensions
},
*/
