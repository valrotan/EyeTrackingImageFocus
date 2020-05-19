const collisionSVG = "collisionSVG";

window.onload = function() {

    var localstorageLabel = 'webgazerGlobalData';
    window.localStorage.setItem(localstorageLabel, null);

    webgazer.setRegression('ridge') /* currently must set regression and tracker */
        .setTracker('clmtrackr')
        .begin()
        .showPredictionPoints(false); /* shows a square every 100 milliseconds where current prediction is */

    function checkIfReady() {
        var feedbackBox = document.getElementById(webgazer.params.faceFeedbackBoxId);

        if (!webgazer.isReady()) {
            setTimeout(checkIfReady, 100);
        }
        // This isn't strictly necessary, but it makes the DOM easier to read
        // to have the z draw order reflect the DOM order.
        else if (typeof(feedbackBox) == 'undefined' || feedbackBox == null) {
            setTimeout(checkIfReady, 100);
        } else {
            // Add the SVG component on the top of everything.
            setup();
            webgazer.setGazeListener(collisionEyeListener);
        }
    }

    setTimeout(checkIfReady, 100);
};

window.onbeforeunload = function() {
    //webgazer.end(); //Uncomment if you want to save the data even if you reload the page.
    window.localStorage.clear(); //Comment out if you want to save data across different sessions
}

function setup() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    var svg = d3.select("body").append("svg")
        .attr("id", collisionSVG)
        .attr("width", width)
        .attr("height", height)
        .style("top", "0px")
        .style("left", "0px")
        .style("margin", "0px")
        .style("position", "absolute")
        .style("z-index", 100000);

    svg.append("rect")
        .attr("id", "movingAverage")
        .attr("width", 5)
        .attr("height", 5)
        .attr("fill", "blue");
}

var MovingAverage = function(count) {
    this.arr = new Array(count).fill(0);
    this.count = count;
    this.sum = 0;
    this.cur = 0;
    this.isActive = false; // whether the average already includes count values or not
}

MovingAverage.prototype.average = function() {
    return this.sum / this.count;
}

MovingAverage.prototype.update = function(value) {
    old = this.arr[this.cur];
    this.arr[this.cur] = value;
    this.cur++;
    if (this.cur >= this.count) {
        this.isActive = true;
        this.cur = 0;
    }

    this.sum -= old - value;
    return this.average();
}

const averageCount = 16;
var movingX = new MovingAverage(averageCount);
var movingY = new MovingAverage(averageCount);
var curFrame = 0;

var focusMap = null;
var cellSizeX = 0;
var cellSizeY = 0;
var video = null;

var screenToVideoPos = null;
var loadedScripts = false;

$.get("out.txt", function(data) {
    var items = data.split("\n").filter(l => l.length > 0).map(function(el) {
        return el.split(" ").map(i => parseInt(i));
    });
    focusMap = items;
    video = $('#video')[0];

    video.onloadeddata = function() {
        var expRatio = video.videoWidth / video.videoHeight;
        var visibleHeight = video.offsetHeight;
        var visibleWidth = video.offsetWidth;
        var actRatio = visibleWidth / visibleHeight;
        var cutoffX = 0;
        var cutoffY = 0;
        if (actRatio < expRatio) { // cuts off left/right
            var expectedWidth = visibleHeight * expRatio;
            cutoffX = (expectedWidth - visibleWidth) / 2;
        } else if (actRatio > expRatio) { // cuts off top/bottom
            var expectedHeight = visibleWidth / expRatio;
            cutoffY = (expectedHeight - visibleHeight) / 2;
        }
        console.log(video.videoWidth, cutoffX, cutoffY)

        cellSizeX = (visibleWidth + 2 * cutoffX) / focusMap[0].length;
        cellSizeY = (visibleHeight + 2 * cutoffY) / focusMap.length;

        screenToVideoPos = function(sx, sy) {
            return [sx + cutoffX, sy + cutoffY];
        }
        loadedScripts = true;
    }
    video.load()
});

function clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
}

var collisionEyeListener = function(data, clock) {
    if (!data)
        return;

    var cl = webgazer.getTracker().clm;
    var whr = webgazer.getVideoPreviewToCameraResolutionRatio();

    maX = movingX.update(data.x)
    maY = movingY.update(data.y)
    var mabox = d3.select("#movingAverage")
        .attr("x", maX)
        .attr("y", maY);

    if (!loadedScripts) {
        return
    }
    var x = maX;
    var y = maY;
    var vpos = screenToVideoPos(x, y);
    var vx = vpos[0],
        vy = vpos[1];
    var boxX = clamp(Math.round(vx / cellSizeX), 0, focusMap[0].length - 1)
    var boxY = clamp(Math.round(vy / cellSizeY), 0, focusMap.length - 1)
    var targetFrameIndex = focusMap[boxY][boxX];

    const kP = 1;
    if (targetFrameIndex < curFrame) {
        curFrame -= kP;
    } else if (targetFrameIndex > curFrame) {
        curFrame += kP;
    }

    console.log(curFrame);
    video.currentTime = curFrame / 30;
}
