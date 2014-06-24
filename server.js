var express = require('express');
var fs = require('fs');
var csv = require('csv');
var app = express();
app.use(express.static(__dirname + '/public'));
app.configure(function(){
  app.use(express.bodyParser());
  app.use(app.router);
});

var port = 3000;
var language = "en-us";

var stepFinished = 99;
var stepResponseDynamic = 50;
var stepSliders1 = 25;
var stepSliders2 = 30;
var stepSliders3 = 35;
var stepChoiceGrid1 = 13;
var stepChoiceGrid2 = 16;
var stepChoiceGrid3 = 19;
var stepSurvey4 = 6;
var stepSurvey3 = 3;
var stepSurvey2 = 2;
var stepSurvey1 = 1;
var stepInvalidError = 0;

var techContact = ["Casey Capps","capps@ohio.edu"];
var techContactLink = "<a href=\"mailto:" + techContact[1] + "\"><span>" + techContact[0] + "(" + techContact[1] + ")</span></a>\n";
var researcherContact = ["Janna Chimeli", "chimelij@ohio.edu"];
var researcherContactLink = "<a href=\"mailto:" + researcherContact[1] + "\"><span>" + researcherContact[0] + "(" + researcherContact[1] + ")</span></a>\n";

var finishedMessage = "<h2>You are finished.  Thank you for your participation.</h2>\n";
var noJavaScriptMessage = "<h2>JavaScript is Required</h2>\n<p>Your browser does not support JavaScript, or it is disabled.  This web-based experiment will not function correctly without it.  Please enable JavaScript or change browsers.  If this is not possible, please contact the researcher:" + researcherContactLink + ".  If you feel this is in error, please contact the system administrator: " + techContactLink + ".</p>\n";

var errorNoSubjectFileSpecified = ["noSubject", "<h2>No subject file specified.</h2>\n"];
var errorDefault = ["default","<h2>An error has occurred.</h2>\n<p><span>Please contact " + techContactLink + " to notify the system administrator</span></p>"];
var errorNoGridFile = ["noGrid","<h2>ERROR: Grid file not present.</h2>\n"];
var errorNoSlidersFile = ["noSliders","<h2>ERROR: Sliders file not present.</h2>\n"];
var errorNoSurveyFile = ["noSurvey", "<h2>ERROR: Survey file not present.</h2>\n"];
var errorInvalidExperiment = ["invalidExperiment","<h2>Invalid experiment.</h2>\n"];
var errorInvalidPhase = ["invalidExperiment","<h2>Invalid experiment step.</h2>\n"];
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
			return errorDefault[1];
	}
}

function determinePhase(line) {
	switch(line) {
		case "END RESPONSE DYNAMICS":
			return stepFinished;
		case "END SLIDERS THREE":
			//return stepResponseDynamic;
			return stepFinished;
		case "END SLIDERS TWO":
			return stepSliders3;
		case "END SLIDERS ONE":
			return stepSliders2;
		case "END CHOICE GRID THREE":
			return stepSliders1;
		case "END CHOICE GRID TWO":
			return stepChoiceGrid3;
		case "END CHOICE GRID ONE":
			return stepChoiceGrid2;
		case "END SURVEY FOUR":
			return stepChoiceGrid1;
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
		case stepChoiceGrid1:
		case stepChoiceGrid2:
		case stepChoiceGrid3:
		top += "<script src=\"/js/Timers.js\"></script>\n";
		top += "<script src=\"/js/ChoiceGrid.js\"></script>\n";
		top += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/choicegrid.css\">\n";
		break;
		case stepSliders1:
		case stepSliders2:
		case stepSliders3:
		top += "<script src=\"/js/Timers.js\"></script>\n";
		top += "<script src=\"/js/Sliders.js\"></script>\n";
		top += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/sliders.css\">\n";
		break;
		default:
		break;
	}
	top += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/base.css\">\n";
	top += "</head>\n";
	top += "<body>\n";
	top += "<noscript>" + noJavaScriptMessage + "</noscript>";
	top += "<form id=\"jdmForm\" method=\"post\">\n"
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
	
	gridHtml += "<input type=\"hidden\" id=\"movelog\" name=\"movelog\" />";
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
		slidersHtml += "<span class=\"leftPole\">" +  sliderLeftPole + "</span>";
		slidersHtml += "<input class=\"slider\" type = \"range\" name = \"" + sliderName + "\" min=\"" + sliderMin +"\" + max=\"" + sliderMax + "\" step = \"" + sliderStep + "\" value = \"" + sliderValue +  "\" />\n";
		slidersHtml += "<span class=\"rightPole\">" +  sliderRightPole + "</span>\n";
		slidersHtml += "</div>\n"
		slidersHtml += "<div class=\"labelsDiv\">\n";
		slidersHtml += "<span class=\"midPoint\">" +  sliderMidPoint + "</span>";
		slidersHtml += "</div>\r"
		slidersHtml += "</div>\r"
	}
	slidersHtml += "<input type=\"hidden\" id=\"starttime\" name=\"starttime\" />";
	slidersHtml += "<input type=\"hidden\" id=\"time\" name=\"time\" />";
	slidersHtml += "<input type=\"hidden\" id=\"stoptime\" name=\"stoptime\" />";
	slidersHtml += "<button onclick=\"submitSliders();\">Submit</button>\r";
	return slidersHtml;		
}

function parseSurvey(survey) {
	var data;
	try {
	data = fs.readFileSync('survey' + survey + '.html', 'utf8');
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			return getErrorHtml(errorNoSurveyFile);		} else {
			  throw err;
		}
	}
	data += "<input type=\"submit\">\r";
	return data;
}

function withId (req, res) {
	
	var dataToSend = "";
	var id = req.params.id;
	var experiment = parseFile(id);
	var gridFile = experiment[0];
	var slidersFile = experiment[1];
	var phase = experiment[2];
	dataToSend += generateTop(phase);
	switch (phase) {
		case stepFinished:
			dataToSend += finishedMessage;
			break;
		//Response Dynamic on Hold, for later.
		/*case stepResponseDynamic:
			dataToSend += "<h2>The Response Dynamic Step will be here when done.</h2>";
			break;*/
		case stepSliders3:
			dataToSend += parseSliders(slidersFile);
			break;
		case stepSliders2:
			dataToSend += parseSliders(slidersFile);
			break;
		case stepSliders1:
			dataToSend += parseSliders(slidersFile);
			break;
		case stepChoiceGrid3:
			dataToSend += parseGrid("grid3.csv");
			break;
		case stepChoiceGrid2:
			dataToSend += parseGrid("grid2.csv");
			break;
		case stepChoiceGrid1:
			dataToSend += parseGrid("grid1.csv");
			break;
		case stepSurvey4:
			dataToSend += parseSurvey(4);
			break;
		case stepSurvey3:
			dataToSend += parseSurvey(3);
			break;
		case stepSurvey2:
			dataToSend += parseSurvey(2);
			break;
		case stepSurvey1:
			dataToSend += parseSurvey(1);
			break;
		default:
			dataToSend += getErrorHtml(errorInvalidPhase);
			break;
	}
	dataToSend += generateBottom();
	res.send(dataToSend);
}

function writeData (filename, data) {
	try {
		fs.appendFileSync(filename + '.txt', data, 'utf8');
	} catch (err) {
		throw err;
	}
}

function writeGrid(inData, grid) {
	var outData = "";
	var gridNumber = getNumberText(grid);
	outData += "\nBEGIN CHOICE GRID ";
	outData += gridNumber;
	outData += "\n";
	outData += inData["movelog"];
	outData += "\nEND CHOICE GRID ";
	outData += gridNumber;
	return outData;
}

function writeAllKeys(inData) {
	var outData = "";
	for (var k in inData) {
		outData += k;
		outData += ": ";
		outData += inData[k];
		outData += "\n";
	}
	return outData;
}

function writeSliders(inData, slider) {
	var startTime = inData['starttime'];
	var stopTime = inData['stoptime'];
	var outData = "";
	var sliderNumber = getNumberText(slider);
	outData += "\nBEGIN SLIDERS";
	outData += sliderNumberl
	outData += "\n";
	outData += "START TIME: " + startTime + "\n";
	outData += "Rating finished in " + inData['time'] + " milliseconds.\n"
	delete inData['time'];
	delete inData['starttime'];
	delete inData['stoptime'];
	outData += writeAllKeys(inData);
	outData += "STOP TIME: " + stopTime + "\n";
	outData += "END SLIDERS ";
	outData += sliderNumber;
	return outData;
}

function getNumberText(number) {
	switch (number) {
			case 1:
				return "ONE";
			case 2:
				return "TWO";
			case 3:
				return "THREE";
			case 4:
				return "FOUR";
		}
}

function writeSurvey(inData, survey) {
	var outData = "";
	var surveyNumber = getNumberText(survey);
	outData += "\nBEGIN SURVEY "
	outData += surveyNumber;
	outData += "\n";
	outData += writeAllKeys(inData);
	outData += "END SURVEY ";
	outData += surveyNumber;
	return outData;
}

function postWithId (req, res) {
	var body = req.body;
	var id = req.params.id;
	var experiment = parseFile(id);
	var phase = experiment[2];
	var data = "";
	switch (phase) {
			case stepResponseDynamic:
				break;
			case stepSliders3:
				data += writeSliders(body, 3);
				break;
			case stepSliders2:
				data += writeSliders(body, 2);
				break;
			case stepSliders1:
				data += writeSliders(body, 1);
				break;
			case stepChoiceGrid3:
				data += writeGrid(body, 3);
				break;
			case stepChoiceGrid2:
				data += writeGrid(body, 2);
				break;
			case stepChoiceGrid1:
				data += writeGrid(body, 1);
				break;
			case stepSurvey4:
				data += writeSurvey(body, 4);
				break;
			case stepSurvey3:
				data += writeSurvey(body, 3);
				break;
			case stepSurvey2:
				data += writeSurvey(body, 2);
				break;
			case stepSurvey1:
				data += writeSurvey(body, 1);
				break;
			default:
				return;
		}
	writeData(id, data);
	res.redirect("/" + req.params.id);
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
});

app.get("/:id", withId);

app.post("/:id", postWithId);

app.listen(process.env.PORT || port);