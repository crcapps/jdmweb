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
var stepInvalidError = 0;

var techContact = ["Casey Capps","capps@ohio.edu"];
var techContactLink = "<a href=\"mailto:" + techContact[1] + "\"><span>" + techContact[0] + "(" + techContact[1] + ")</span></a>\n";

var errorNoSubjectFileSpecified = ["noSubject", "<h2>No subject file specified.</h2>\n"];
var errorDefault = ["default","<h2>An error has occurred.</h2>\n<p><span>Please contact " + techContactLink + " to notify the </span></p>"];
var errorNoGridFile = ["noGrid","<h2>ERROR: Grid file not present</h2>\n"];
var errorNoSlidersFile = ["noSliders","<h2>ERROR: Sliders file not present</h2>\n"];
var errorInvalidExperiment = ["invalidExperiment","<h2>Invalid experiment.</h2>\n"];
var errorInvalidRankMode = ["invalidRankMode", "<h2>Not a valid ranking mode for choice grid.</h2>"];

function getErrorHtml(errortype) {
	switch (errortype[0]) {
		case errorNoSubjectFileSpecified[0]:
			return errorNoSubjectFileSpecified[1];
		case errorNoGridFile[0]:
			return errorNoGridFile[1];
		case errorNoSlidersFile[0]:
			return errorNoSlidersFile[1];
		case errorInvalidRankMode[0]:
			return errorInvalidRankMode[1];
		default:
			return errorDefault;
	}
}


app.get("/", function (req, res) {
	var data = "<!DOCTYPE html>\n"; 
	data += "<html lang=" + "\"" + language + "\">\n";
	data += "<head>\n";
	data += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/choicegrid.css\">\n";
	data += "</head>\n";
	data += "<body>\n";
	data += getErrorHtml(errorNoSubjectFileSpecified);
	data += "</body>\n"
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
		  return  stepInvalidError;
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
	top += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/base.css\">\n";
	top += "</head>\n";
	top += "<body>\n";
	top += "<form>\n"
	return top;
}

function generateBottom() {
	var bottom = "</form>\n"
	bottom +=  "</body>\n"
	bottom += "</html>";
	return bottom;
}

function gridEliminationMode(mode) {
	switch (mode.toString()) {
		case "RANKMODE SingleChoice":
			return "single";
		case "RANKMODE BestFirst":
			return "best";
		case "RANKMODE WorstFirst":
			return "worst";
		default:
			return "other";
	}
}

function parseGrid(gridFile) {
	var data;
	try {
	data = fs.readFileSync(gridFile, 'utf8');
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			return getErrorHtml(errorNoGridFile);		}
	 else {
		  throw err;
		}
	}
	var gridHtml = "";
	var lines = data.split('\n');
	var elimMode = lines.slice(0,1);
	var rankMode = gridEliminationMode(elimMode);
	lines.splice(0,1)
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
				 gridHtml += "<a id=\"choice:" + row + "\" href=\"#\" onclick=\"makeChoice(" + row + ",\'" + col + "\', \'"  + rankMode + "\');\">" + col + "</a>";
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
			return getErrorHtml(errorNoSlidersFile);		} else {
		  throw err;
		}
	}
	var slidersHtml = "";
	var lines = data.split('\n');
	lines.splice(0, 1);
	var row = 0;
	var column = 0;
	for (var l in lines) {
		var line = lines[l];
		var theLine = line.split(',');
		//name,max,min,step,value,question,minlabel,maxlabel,midlabel
		var sliderName = theLine[0];
		var sliderMax = theLine[1];
		var sliderMin = theLine[2];
		var sliderStep = theLine[3];
		var sliderValue = theLine[4];
		var sliderQuestion = theLine[5];
		var sliderLeftPole = theLine[6];
		var sliderRightPole = theLine[7];
		var sliderMidPoint = theLine[8];
		slidersHtml += "<div class=\"sliderWrapper\">\n";
		slidersHtml += "<div class=\"topLabelDiv\"";
		slidersHtml += "<span class=\"topLabel\">" +  sliderQuestion + "</span>";
		slidersHtml += "</div>\r"
		slidersHtml += "<div class=\"sliderDiv\">\n";
		slidersHtml += "<input class=\"slider\" type = \"range\" name = \"" + sliderName + "\" min=\"" + sliderMin +"\" + max=\"" + sliderMax + "\" step = \"" + sliderStep + "\" value = \"" + sliderValue +  "\" />\n";
		slidersHtml += "</div>\n"
		slidersHtml += "<div class=\"labelsDiv\">\n";
		slidersHtml += "<span class=\"leftPole\">" +  sliderLeftPole + "</span>";
		slidersHtml += "<span class=\"midPoint\">" +  sliderMidPoint + "</span>";
		slidersHtml += "<span class=\"rightPole\">" +  sliderRightPole + "</span>\n";
		slidersHtml += "</div>\r"
		slidersHtml += "</div>\r"
	}
	slidersHtml += "<input type=\"submit\" />\r"
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
			dataToSend += getErrorHtml(errorInvalidExperiment);
			break;
	}
	dataToSend += generateBottom();
	res.send(dataToSend);
}