var path = require('path');
var fs = require('fs');

function isEnglish(record) {
	return record.platformID === 3 && record.encodingID === 1 && record.languageID === 1033 || record.platformID === 1 && record.encodingID === 0 && record.languageID === 0;
}

var glyfsource = '';
process.stdin.resume();
process.stdin.on('data', function (buf) { glyfsource += buf.toString(); });
process.stdin.on('end', function () {
	var font = JSON.parse(glyfsource.trim());
	var family = '';
	var style = '';
	for (var j = 0; j < font.name.length; j++) {
		var record = font.name[j];
		if (isEnglish(record)) {
			if (record.nameID === 16) {
				family = record.nameString;
			} else if (record.nameID === 17) {
				style = record.nameString;
			}
		}
	}
	if (!family || !style) {
		for (var j = 0; j < font.name.length; j++) {
			var record = font.name[j];
			if (isEnglish(record)) {
				if (record.nameID === 1) {
					family = record.nameString;
				} else if (record.nameID === 2) {
					style = record.nameString;
				}
			}
		}
	}
	style = style.replace(/Italic$/, ' Italic').replace(/XBold/, 'ExtraBold');
	if (!style) {
		style = "Regular"
	}
	family = family.trim();
	style = style.trim();
	process.stderr.write('Preferred Family & Style: ' + family + ' - ' + style + '\n');

	var compatFamily = family;
	var compatStyle = style;
	if (style !== 'Regular' && style !== 'Italic' && style !== 'Bold' && style !== 'Bold Italic') {
		compatFamily = family + ' ' + style;
		if (/Italic$/.test(compatFamily)) {
			compatFamily = compatFamily.replace(/Italic$/, '').trim();
			compatStyle = 'Italic'
		} else {
			compatStyle = 'Regular'
		}
	}

	process.stderr.write('Compatibility Family & Style: ' + compatFamily + ' - ' + compatStyle + '\n');

	var hasID16 = false;
	var hasID17 = false;
	for (var j = 0; j < font.name.length; j++) {
		if (isEnglish(font.name[j])) {
			if (font.name[j].nameID === 1) {
				font.name[j].nameString = compatFamily;
			} else if (font.name[j].nameID === 2) {
				font.name[j].nameString = compatStyle;
			} else if (font.name[j].nameID === 4) {
				font.name[j].nameString = style === "Regular" ? family : family + ' ' + style;
			} else if (font.name[j].nameID === 16) {
				font.name[j].nameString = family;
				hasID16 = true;
			} else if (font.name[j].nameID === 17) {
				font.name[j].nameString = style;
				hasID17 = true;
			}
		}
	}
	if (!hasID16) {
		font.name.push({
			platformID: 3,
			encodingID: 1,
			languageID: 1033,
			nameID: 16,
			nameString: family
		});
		font.name.push({
			platformID: 1,
			encodingID: 0,
			languageID: 0,
			nameID: 16,
			nameString: family
		});
	}
	if (!hasID17) {
		font.name.push({
			platformID: 3,
			encodingID: 1,
			languageID: 1033,
			nameID: 17,
			nameString: style
		});
		font.name.push({
			platformID: 1,
			encodingID: 0,
			languageID: 0,
			nameID: 17,
			nameString: style
		});
	}
	if (compatStyle === 'Regular') {
		font.head.macStyle.bold = false;
		font.head.macStyle.italic = false;
		font.OS_2.fsSelection.bold = false;
		font.OS_2.fsSelection.italic = false;
		font.OS_2.fsSelection.regular = true;
	} else if (compatStyle === 'Italic') {
		font.head.macStyle.bold = false;
		font.head.macStyle.italic = true;
		font.OS_2.fsSelection.bold = false;
		font.OS_2.fsSelection.italic = true;
		font.OS_2.fsSelection.regular = false;
	} else if (compatStyle === 'Bold') {
		font.head.macStyle.bold = true;
		font.head.macStyle.italic = false;
		font.OS_2.fsSelection.bold = true;
		font.OS_2.fsSelection.italic = false;
		font.OS_2.fsSelection.regular = false;
	} else if (compatStyle === 'Bold Italic') {
		font.head.macStyle.bold = true;
		font.head.macStyle.italic = true;
		font.OS_2.fsSelection.bold = true;
		font.OS_2.fsSelection.italic = true;
		font.OS_2.fsSelection.regular = false;
	}
	font.OS_2.fsSelection.useTypoMetrics = true;

	font.OS_2.usWeightClass = 400;
	if (/Bold/.test(style)) {
		font.OS_2.usWeightClass = 700;
	} else if (/Thin/.test(style)) {
		font.OS_2.usWeightClass = 100;
	} else if (/Medium/.test(style)) {
		font.OS_2.usWeightClass = 500;
	} else if (/Semi Bold|SemiBold|Semi|Demi Bold|DemiBold|Demi/.test(style)) {
		font.OS_2.usWeightClass = 500;
	} else if (/ExtraBold/.test(style)) {
		font.OS_2.usWeightClass = 800;
	} else if (/Black/.test(style)) {
		font.OS_2.usWeightClass = 900;
	} else if (/Light/.test(style)) {
		font.OS_2.usWeightClass = 300;
	} else if (/ExtraLight/.test(style)) {
		font.OS_2.usWeightClass = 200;
	}

	process.stdout.write(JSON.stringify(font));
});