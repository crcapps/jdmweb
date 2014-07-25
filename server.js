var express = require('express');
var fs = require('fs');
var csv = require('csv');
var app = express();
var endOfLine = require('os').EOL;
var path = require('path');

app.use(express.static(__dirname + '/public'));
app.configure(function(){
  app.use(express.bodyParser());
  app.use(app.router);
});

var port = process.env.PORT || 3000;
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
var errorInvalidSubject = ["invalidSubject", "<h2>Participant not found</h2>"];
var errorNoGridFile = ["noGrid","<h2>ERROR: Grid file not present.</h2>\n"];
var errorNoSlidersFile = ["noSliders","<h2>ERROR: Sliders file not present.</h2>\n"];
var errorNoSurveyFile = ["noSurvey", "<h2>ERROR: Survey file not present.</h2>\n"];
var errorInvalidExperiment = ["invalidExperiment","<h2>Invalid experiment.</h2>\n"];
var errorInvalidPhase = ["invalidExperiment","<h2>Invalid experiment step.</h2>\n"];
var errorInvalidRankMode = ["invalidRankMode", "<h2>Not a valid ranking mode for choice grid.</h2>"];
var errorInvalidCredentials = ["invalidCredentials", "<h2>Invalid request.</h2>"];
var errorMalformedCommand = ["malformedCommand", "<h2>Malformed command received.  Check syntax.</h2>"];
var errorBadConfiguration = ["badConfiguration", "<h2>Bad configuration file.</h2>\n<p><span>Please contact " + techContactLink + " to notify the system administrator</span></p>"];

function getErrorHtml(errortype) {
	switch (errortype[0]) {
		case errorNoSubjectFileSpecified[0]:
			return errorNoSubjectFileSpecified[1];
		case errorInvalidSubject[0]:
			return errorInvalidSubject[1];
		case errorNoGridFile[0]:
			return errorNoGridFile[1];
		case errorNoSlidersFile[0]:
			return errorNoSlidersFile[1];
		case errorInvalidRankMode[0]:
			return errorInvalidRankMode[1];
		case errorInvalidCredentials[0]:
			return errorInvalidCredentials[1];
		case errorMalformedCommand[0]:
			return errorMalformedCommand[1];
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
			return stepChoiceGrid3;
		case "END SLIDERS ONE":
			return stepChoiceGrid2;
		case "END CHOICE GRID THREE":
			return stepSliders3;
		case "END CHOICE GRID TWO":
			return stepSliders2;
		case "END CHOICE GRID ONE":
			return stepSliders1;
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
		data = fs.readFileSync('./subjects/' + filename + '.txt', 'utf8');
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
	return determinePhase(lastLine);
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
	top += "<form id=\"jdmForm\" method=\"post\">\n";
	return top;
}

function generateBottom() {
	var bottom = "</form>\n";
	bottom +=  "</body>\n";
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
	data = fs.readFileSync('./grid/' + gridFile, 'utf8');
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			return getErrorHtml(errorNoGridFile);		}
	 else {
		  throw err;
		}
	}
	var gridHtml = "<div class=\"gridwrapper\">\n";
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
			gridHtml += "<span class=\"Centerer\"></span><span class=\"Centered\">";
			if (isRowHeader && !isColumnHeader) {
				 gridHtml += "<a id=\"choice:" + row + "\" href=\"#\" onclick=\"makeChoice(" + row + ",\'" + col + "\', \'"  + rankMode + "\');\">" + col + "</a>";
			}
			else {
				gridHtml += col;
			}
			gridHtml += "</span></span>\n";
			gridHtml += "</div>\n";
			column ++;
		}
		gridHtml += "<div style=\"clear:both\">\n";
		row++;
		column = 0;
	}
	row = 0;
	gridHtml += "</div>\n";
	gridHtml += "<input type=\"hidden\" id=\"movelog\" name=\"movelog\" />\n";
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
		slidersHtml += "</div>\n"
		slidersHtml += "<div class=\"sliderDiv\">\n";
		slidersHtml += "<span class=\"leftPole\">" +  sliderLeftPole + "</span>";
		slidersHtml += "<input class=\"slider\" type = \"range\" name = \"" + sliderName + "\" min=\"" + sliderMin +"\" + max=\"" + sliderMax + "\" step = \"" + sliderStep + "\" value = \"" + sliderValue +  "\" />\n";
		slidersHtml += "<span class=\"rightPole\">" +  sliderRightPole + "</span>\n";
		slidersHtml += "</div>\n"
		slidersHtml += "<div class=\"labelsDiv\">\n";
		slidersHtml += "<span class=\"midPoint\">" +  sliderMidPoint + "</span>";
		slidersHtml += "</div>\n"
		slidersHtml += "</div>\n"
	}
	slidersHtml += "<input type=\"hidden\" id=\"starttime\" name=\"starttime\" />\n";
	slidersHtml += "<input type=\"hidden\" id=\"time\" name=\"time\" />\n";
	slidersHtml += "<input type=\"hidden\" id=\"stoptime\" name=\"stoptime\" />\n";
	slidersHtml += "<button onclick=\"submitSliders();\">Submit</button>\n";
	return slidersHtml;		
}

function parseSurvey(survey) {
	var data;
	try {
	data = fs.readFileSync('./survey/survey' + survey + '.html', 'utf8');
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			return getErrorHtml(errorNoSurveyFile);		} else {
			  throw err;
		}
	}
	data += "<input type=\"submit\">\n";
	return data;
}

function withId (req, res) {
	
	var dataToSend = "";
	var id = req.params.id;
	var phase = parseFile(id);
	var slidersFile = "./slider/sliders.csv";
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
		fs.appendFileSync("./subjects/" + filename + '.txt', data, 'utf8');
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
	outData += sliderNumber
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
	var phase = parseFile(id);
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

function getAdminHtml() {
	var data = "<form id=\"admin\" method=\"post\" action=\"admin\">\n";
	data += "<textarea name=\"commands\" form=\"admin\">\n";
	data += "</textarea>\n";
	data += "<br/>\n";
	data += "<input type=\"submit\" value=\"Submit\" />\n";
	data += "</form>\n";
	return data;
}

function parseCommand(command, res) {
	var returnHtml = "<!DOCTYPE html>\n"; 
				returnHtml += "<html lang=" + "\"" + language + "\">\n";
				returnHtml += "<head>\n";
				returnHtml += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/choicegrid.css\">\n";
				returnHtml += "</head>\n";
				returnHtml += "<body>\n";
	switch (command[0].toUpperCase()) {
		case "CREATE SUBJECTS":
			var subjects = command.slice(1).filter(function(v){return v!==''});
			var created = 0;
			var failed = 0;
			var duplicates = 0;
			for (var i = 0; i < subjects.length; i++) {
				var subject = subjects[i].replace(/\W/g, '');
				if (fs.existsSync("./subjects/" + subject + ".txt")) {
					duplicates++;
					failed++;
					returnHtml += "<span>Subject " + subject + " already exists.  Ignoring.</span><br />\n";
				} else {
					try {
						fs.writeFileSync("./subjects/" + subject + ".txt");
						created++;
					}
					catch (err) {
						returnHtml = "<span>Error writing file for subject " + subject + "</span><br />\n";
						failed++;
					}
					
					returnHtml += "<span>Subject " + subject + " created.</span><br />\n";
				}
			}
			returnHtml += "<span>" + created + " new records created.</span><br />\n";
			returnHtml += "<span>" + failed + " records failed to create: " + duplicates + " were duplicate records ignored.</span><br />\n";
			break;
		case "DELETE SUBJECTS":
			var subjects = command.slice(1).filter(function(v){return v!==''});
			var removed = 0;
			var failed = 0;
			var ignored = 0;
			for (var i = 0; i < subjects.length; i++) {
				var subject = subjects[i].replace(/\W/g, '');
				if (fs.existsSync("./subjects/" + subject + ".txt")) {
					try {
						fs.unlinkSync("./subjects/" + subject + ".txt");
						returnHtml += "<span>Removed file for subject " + subject + "</span><br />\n";
						removed++;
					}
					catch (err) {
						returnHtml += "<span>Error removing file for subject " + subject + ".  Error: " + err + "</span><br />\n";
						failed++;
						}
				} else {
					
					returnHtml += "<span>Subject " + subject + " doesn't exist.  Ignoring.</span><br />\n";
					ignored++;
				}
			}
			returnHtml += "<span>" + removed + " records removed.</span><br />\n";
			returnHtml += "<span>Failure removing " + failed + " records: " + ignored + " were nonexistent records ignored.</span><br />\n";
			break;
		case "LIST SUBJECTS":
			var subjects = fs.readdirSync("./subjects").filter(function(v){ return /\.txt/.test(v); });
			for (var i = 0; i < subjects.length; i++) {
				returnHtml += "<span>" + subjects[i].replace('.txt','') + "</span><br />\n";
			}
			break;
		case "EXPORT":
			var subjects = fs.readdirSync("./subjects").filter(function(v){ return /\.txt/.test(v); });
			var ex ='';
			for (var i = 0; i < subjects.length; i++) {
				try {
					var file = fs.readFileSync("./subjects/" + subjects[i],"utf8");
					ex += "BEGIN SUBJECT " + subjects[i].replace(".txt", "") + "\n\n";
					ex += file;
					ex += "\n\nEND SUBJECT " + subjects[i].replace(".txt", "") + "\n\n";
				}
				catch (err) {
					ex += "\n\nEXPORT OF SUBJECT " + subjects[i].replace(".txt", "") + " FAILED!!!\n\n";
				}
			}
			res.set({"Content-Disposition":"attachment; filename=\"export.txt\""});
			res.contentType("text/plain");
			   res.send(ex);
			break;
		default:
			returnHtml += getErrorHtml(errorMalformedCommand);
	}
	returnHtml += getAdminHtml();
	returnHtml += "</body>\n"
	returnHtml += "</html>";
	return returnHtml;
}

function getAdmin(req, res) {
	var data = "<!DOCTYPE html>\n"; 
		data += "<html lang=" + "\"" + language + "\">\n";
		data += "<head>\n";
		data += "<link rel=\"stylesheet\" type=\"text/css\" href=\"/css/choicegrid.css\">\n";
		data += "</head>\n";
		data += "<body>\n";
		data += getAdminHtml();
		data += "</body>\n"
		data += "</html>";
		res.send(data);
}

function postAdmin(req, res) {
	var config;
	var returnHtml = '';
	try {
		config = fs.readFileSync('./config/config.csv', 'utf8');
	}
	catch(err) {
		returnHtml = getErrorHtml(errorDefault);
	}
	var lines = config.split('\n');
	var firstLine = lines[0];
	var user = firstLine.split(',')[0].replace(/\r$/, '').replace(/\n$/, '');
	var pass = firstLine.split(',')[1].replace(/\r$/, '').replace(/\n$/, '');
	var body = req.body;
	var commands = req.body.commands.split(endOfLine);
	for (var i = 0; i < commands.length; i++) {
						commands[i] = commands[i].replace(/\r$/, '').replace(/\n$/, '');
					}
	if (commands[0] === user && commands[1] === pass) {
		returnHtml = parseCommand(commands.slice(2), res);
	} else {
		returnHtml += getErrorHtml(errorInvalidCredentials);
	}
	res.send(returnHtml);
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

app.get("/admin", getAdmin);

app.post("/admin", postAdmin)

app.get("/:id", withId);

app.post("/:id", postWithId);

app.listen(process.env.PORT || port);