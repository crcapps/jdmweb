var express = require('express');
var fs = require('fs');
var csv = require('csv');
var app = express();
app.use(express.static(__dirname + '/public'));

var port = 3000;
var language = "en-us";

var stepFinished = 99;
var stepResponseDynamic = 50;
var stepSliders = 25;
var stepChoiceGrid = 13;
var stepSurvey4 = 6;
var stepSurvey3 = 3;
var stepSurvey2 = 2;
var stepSurvey1 = 1;


app.get("/", function (req, res) {
	var data = "<!DOCTYPE html>\n"; 
	data += "<html lang=" + "\"" + language + "\">\n";
	data += "<head>\n";
	data += "<h2>Here's an experiment, you didn't do it right</h2>\n"
	data += "</head>\n";
	data += "<body>\n";
	data = "</body>\n"
	data += "</html>";
	res.send(data);
})

app.get("/:id", withId)

app.listen(process.env.PORT || port);

function determinePhase(line) {
	switch(line) {
		case "END RESPONSE DYNAMICS":
			return stepFinished;
		case "END SLIDERS":
			return stepResponseDynamic;
		case "END CHOICE GRID":
			return stepSliders;
		case "END SURVEY FOUR":
			return stepChoiceGrid;
		case "END SURVEY THREE":
			return stepSurvey4;
		case "END SURVEY TWO":
			return stepSurvey3;
		case "END SURVEY ONE":
			return stepSurvey2;
		default:
			return stepSurvey1;
	}
}

function parseFile(filename) {
	var data;
	try {
		data = fs.readFileSync(filename + '.txt', 'utf8');
	}
	catch (err)
	{
		if (err.code === 'ENOENT') {
		  return  0;
		} else {
		  throw err;
		}
	}
	var lines = data.split('\n');
	var lastLine = lines.slice(-1)[0];
	var secondLine = lines[1];
	var thirdLine = lines[2]
	return [secondLine,thirdLine,determinePhase(lastLine)];
}

function generateTop(phase) {
	var top = "<!DOCTYPE html>\n"; 
	top += "<html lang=" + "\"" + language + "\">\n";
	top += "<head>\n";
	switch (phase) {
		case stepChoiceGrid:
		top += "<script src=\"/js/Timers.js\"></script>\n";
		top += "<script src=\"/js/ChoiceGrid.js\"></script>\n";
		top += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/choicegrid.css\">\n";
		break;
		case stepSliders:
		top += "<script src=\"/js/Sliders.js\"></script>\n";
		top += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/sliders.css\">\n";
		break;
		default:
		break;
	}
	top += "</head>\n";
	top += "<body>\n";
	return top;
}

function generateBottom() {
	var bottom = "</body>\n"
	bottom += "</html>";
	return bottom;
}

function parseGrid(gridFile) {
	var data;
	try {
	data = fs.readFileSync(gridFile, 'utf8');
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			return "<h2>ERROR: Grid file not present</h2>\n";		}
	 else {
		  throw err;
		}
	}
	var gridHtml = "";
	var lines = data.split('\n');
	var row = 0;
	var column = 0;
	for (var l in lines) {
		var line = lines[l];
		var theLine = line.split(',');
		for (var c in theLine)
		{
			var col = theLine[c];
			var id = column + "," +row;
			var isRowHeader = (column == 0) ? true : false;
			var isColumnHeader = (row == 0) ? true : false;
			var isHeader = (isRowHeader || isColumnHeader) ? true : false;
			var cssclass = (isRowHeader) ? "gridrowheader" : (isColumnHeader) ? "gridcolumnheader" : "gridsquare";
			var spanclass =  isHeader ? "gridheader" : "gridcontent";
			var mouseover = isHeader ?  "" : " onmouseover=\"mouseOverGrid(" + id + ");\"";
			var mouseout = isHeader ? "" : " onmouseout=\"mouseOutGrid(" + id + ");\"";
			gridHtml += "<div id=\"" + id +"\" class=\"" + cssclass + "\"" + mouseover + mouseout + ">\n";
			gridHtml += "<span id=\"cell:" + id + "\" class=\"" + spanclass +  "\">";
			if (isRowHeader && !isColumnHeader) {
				 gridHtml += "<a id=\"choice:" + row + "\" href=\"#\" onclick=\"makeChoice(" + row + ",\'" + col + "\');\">" + col + "</a>";
			}
			else {
				gridHtml += col;
			}
			gridHtml += "</span>\n";
			gridHtml += "</div>\n";
			column ++;
		}
		gridHtml += "<div style=\"clear:both\">\n";
		row++;
		column = 0;
	}
	row = 0;
	return gridHtml;
}

function parseSliders(slidersFile) {
	var data;
	try {
		data = fs.readFileSync(slidersFile, 'utf8');
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			return "<h2>ERROR: Sliders file not present</h2>\n"		} else {
		  throw err;
		}
	}
	var slidersHtml = "";
	var lines = data.split('\n');
	var row = 0;
	var column = 0;
	for (var l in lines) {
		var line = lines[l];
		var theLine = line.split(',');
		for (var c in theLine) {
		}
	}
	return slidersHtml;		
}

function withId (req, res) {
	var dataToSend = "";
	var stuff = parseFile(req.params.id);
	var gridFile = stuff[0];
	var slidersFile = stuff[1];
	var phase = stuff[2];
	dataToSend += generateTop(phase);
	switch (phase) {
		case stepFinished:
			dataToSend += "<h2>You are finished.</h2>\n";
			break;
		case stepResponseDynamic:
			dataToSend += "<h2>The Resolve Dynamic Step will be here when done.</h2>";
			break;
		case stepSliders:
			dataToSend += parseSliders(slidersFile);
			break;
		case stepChoiceGrid:
			dataToSend += parseGrid(gridFile);
			break;
		case stepSurvey4:
			dataToSend += "<h2>Survey 4 will be here when done.</h2>"
			break;
		case stepSurvey3:
			dataToSend += "<h2>Survey 3 will be here when done.</h2>"
			break;
		case stepSurvey2:
			dataToSend += "<h2>Survey 2 will be here when done.</h2>"
			break;
		case stepSurvey2:
			dataToSend += "<h2>Survey 2 will be here when done.</h2>"
			break;
		case stepSurvey1:
			dataToSend += "<h2>Survey 1 will be here when done.";
			break;
		default:
			dataToSend += "<h2>Invalid experiment.</h2>\n";
			break;
	}
	dataToSend += generateBottom();
	res.send(dataToSend);
}