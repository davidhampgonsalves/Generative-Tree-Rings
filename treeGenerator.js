var paper = require('paper'),
	path = require('path'),
	fs = require('fs');

/*
	TODO:
		add grain to inner ring using radiating lines? Maybe generate once and then overlay with rotations on each inner path?
		generate grain over entire tree rather then each ring

		defects
			darkened overlays
			 small circles like bubbles? all grouped together?

		update paper.js

		add ability to generate rings based on good/bad years

		group grain, cracks

		try to create sun that makes sense
*/

// Palate colors must be 6 digit hex
var seedTypes = [
	{
		name: 'White Oak',
		scientificName: 'Quercus alba',
		bark: {
			thickness: {
				max: 35,
				min: 25
			},
			roughness: 0.8
		},
		colorPalate: {
			outerRing: '#bd500d',
			innerRing: '#ec9c3f',
			outerBark: '#555555',
			innerBark: '#312C20',

			crack: '#eeeeee',
			deepCrack: '#666666'
		}
	},

	{
		name: 'White Poplar',
		scientificName: 'Populus alba',
		bark: {
			thickness: {
				max: 12,
				min: 8
			},
			roughness: 0.3
		},
		colorPalate:{
			outerRing: '#b06019',
			innerRing: '#e7a353',
			outerBark: '#4a200e',
			innerBark: '#8b2507',
			crack: '#777777',
			deepCrack: '#1a0300'
		}
	},

	{
		name:'Willow',
		scientificName: 'Salix alba',
		bark: {
			thickness: {
				max: 15,
				min: 10
			},
			roughness: 0.6
		},
		colorPalate: {
			outerRing: '#d28a52',
			innerRing: '#e6caa1',
			outerBark: '#4a200e',
			innerBark: '#6e604d',
			crack: '#777777',
			deepCrack: '#1a0300'
		}
	},

	{
		name: 'Bristlecone Pine',
		scientificName: 'Pinus aristata',
		bark: {
			thickness: {
				max: 15,
				min: 10
			},
			roughness: 0.5
		},
		colorPalate:{
			outerRing: '#b69177',
			innerRing: '#eaccb2',
			outerBark: '#6e604d',
			innerBark: '#78787b',
			crack: '#777777',
			deepCrack: '#1a0300'
		}
	},

	{
		name: 'Hemlock',
		scientificName: 'Tsuga sieboldii)',
		bark: {
			thickness: {
				max: 20,
				min: 10
			},
			roughness: 0.4
		},
		colorPalate: {
			outerRing: '#AB7E55',
			innerRing: '#FBCEA5',
			outerBark: '#636341',
			innerBark: '#3a3928',
			crack: '#34403f',
			deepCrack: '#fcfaed'
		}
	},

	{
		name: 'Grey Scale',
		scientificName: 'Filmus atrum',
		bark: {
			thickness: {
				max: 20,
				min: 10
			},
			roughness: 0.6
		},
		colorPalate:{
			outerRing: '#333333',
			innerRing: '#eeeeee',
			outerBark: '#666666',
			innerBark: '#888888',

			crack: '#aaaaaa',
			deepCrack: '#666666'
		}
	}
];

paper.setup(new paper.Canvas(1024, 768));

var origin = new paper.Point(300, 300);

var randomString = '';
while(randomString.length < 6)
	randomString += String.fromCharCode((Math.random() * Math.random() * 90) + 45);

//randomString = '/Qeaw8';
console.log('using ' + randomString);
var seedGenerator = new SeedGenerator('Davidasdfa');
var seed = seedGenerator.generate(10);
console.log(seed);

var ringGenerator = new RingGenerator(origin, seedGenerator);
var illustrator = new Illustrator(origin, seedGenerator);

//drawEnvironment(seed.environment);

var parent, paths = [], outerIllustratedPath;
for(var year=0 ; year <= seed.years ; year++) {
	ringGenerator.configure(year);

	if(year === 0)
		parent = ringGenerator.generateKnot();
	else
		parent = ringGenerator.generate(parent.simplePath);

	var child = paths[paths.length-1];

	if(year > 0 && year <= seed.years) {
		var options = {};

		if(year === seed.years)
			options.smoothOuterRing = true;

		outerIllustratedPath = illustrator.illustrateRing(year, child.complexPath, parent.complexPath, options);
	}

	paths.push(parent);
}

var child = paths[paths.length-1];
var parent = paths[paths.length-2];

//var barkPath = ringGenerator.generateBark(child.complexPath, parent.complexPath);
//illustrator.illustrateBark(barkPath.complexPath, outerIllustratedPath);

illustrator.illustrateCracks(paths);
illustrator.illustrateGrain(outerIllustratedPath);

//illustrator.illustrateTitle(outerIllustratedPath);

for(var i=paths.length-1 ; i >= 0 ; i--) {
	paths[i].complexPath.remove();
	paths[i].simplePath.remove();
}

console.log('exporting to svg');
var svg = paper.project.exportSVG({
	asString: true,
	precision: 0
});

console.log('saving to file')
fs.writeFile(path.resolve(__dirname, 'out.svg'),svg, function (err) {
	if (err) throw err;

	console.log('Saved!');
});




function RingGenerator(origin, seedGenerator) {
	this.seedGenerator = seedGenerator;
	this.seed = seedGenerator.seed;
	this.environment = seed.environment;
	this.origin = origin;

	this.configure = function configure(year) {
		this.year = year;
		this.environmentState = seedGenerator.getEnvironmentState(year);
		this.thickness = this.calculateThickness();
		this.color = this.calculateColor(this.thickness);
	};

	this.generateKnot = function generateKnot() {
		var knotPath = this.seed.knotPath;
		knotPath.translate(origin);

		return {simplePath: knotPath, complexPath: knotPath};
	}

	this.generateBark = function generateBark(parentPath, childPath) {
		var barkBasePath = childPath;

		var barkPath = new paper.Path();
		var seedDigitIndex = 0;
		var radiusDelta = 0;
		for(var offset=0, len=barkBasePath.length ; offset < len ; offset += this.seedGenerator.nextInRange(0.1, 25)) {
			var point = barkBasePath.getPointAt(offset);

			var radius = this.origin.getDistance(point) + this.seed.bark.thickness.max;

			var thicknessRange = this.seed.bark.thickness.max - this.seed.bark.thickness.min;
			var radiusDelta = this.seed.bark.roughness * this.seedGenerator.nextInRange(-thicknessRange);

			radius += radiusDelta;

			var angle = getAngleInCircle(point, this.origin);
			var angleRange = this.seed.bark.roughness * 0.01;
			angle += this.seedGenerator.nextInRange(-angleRange, angleRange);

			point = getPointInCircle(radius, angle, this.origin);

			barkPath.add(point);
		}

		barkPath.closed = true;

		barkPath.smooth();

		return {simplePath: barkPath, complexPath: barkPath};
	}

	this.generate = function generate(parentPath) {

		var path = parentPath.clone();
		//path.visible = true; // reset vis
		//path.selected = true;
		//path.strokeColor = 'black';

		var averageRadius = 0;
		var _self = this;
		path.segments.map(function(segment) {return averageRadius += _self.origin.getDistance(segment.point);});
		averageRadius /= path.segments.length;

		for(var i=0, len=path.segments.length ; i < len ; i++) {
			var point = path.segments[i].point;

			// get radius of parent point
			var radius = this.origin.getDistance(point);
			var radiusDelta = 0;

			// soften defects by pulling towards normal circle with average radius
			radiusDelta += (averageRadius - radius) * 0.2;

			// get angle of parent point
			var angle = getAngleInCircle(point, this.origin);
			// apply ring thickness
			radiusDelta += this.thickness;

			// apply environment sun type values to points
			for(var g in this.environmentState.growthFactors) {
				var growthFactor = this.environmentState.growthFactors[g];

				// calculate the resultant force on our current angle/radius
				var power = growthFactor.power * (this.thickness * 1.2);
				radiusDelta += power * Math.cos(growthFactor.angle - angle);
			}

			//each ring must be at least a single point bigger then last
			if(radiusDelta < 0)
				radiusDelta = 0;

			if(radiusDelta > this.seed.thickness.max)
				radiusDelta = this.seed.thickness.max;

			radius += radiusDelta;

			var newPoint = getPointInCircle(radius, angle, this.origin).round();

			point.x = newPoint.x;
			point.y = newPoint.y;
		}

		path.smooth();

		//add
		var complexPath = this.addDefectsToPath(path);
		//var layer = new paper.Layer(complexPath);
		//layer.moveBelow(lastLayer);

		return {simplePath: path, complexPath: complexPath};
	}

	this.addDefectsToPath = function addDefectsToPath(path) {
		if(this.environmentState.defects.length > 0) {
			var pathWithDefects = path;
			// add defects
			for(var g in this.environmentState.defects) {
				var defect = this.environmentState.defects[g];

				// add jitter to defect angle so that the defects arn't perfectly straight
				var angleJitter = this.seedGenerator.nextInRange(-0.01, 0.01);

				// get intersection between ring and defect line
				var defectPoint = getPointInCircle(900, defect.angle + angleJitter, this.origin);

				defectPoint = findIntersectionPointInCircle(path, defectPoint, this.origin);
				var defectSize = 6 * Math.abs(defect.power);

				if(defect.shape === 'circle')
					defectShape = new paper.Path.Circle(defectPoint, defectSize);
				else
					defectShape = new paper.Path.RegularPolygon(defectPoint, 3, defectSize);

				var angle = getAngleInCircle(defectPoint, this.origin);
				defectShape.rotate((angle/Math.PI) * 180);

				if (!pathWithDefects)
					pathWithDefects = path;

				pathWithDefects = pathWithDefects[defect.power > 0 ? 'unite' : 'subtract'](defectShape);

				// Convert the path item back to a path to avoid complexPaths
				pathWithDefects = new paper.Path(pathWithDefects.pathData);

				path.remove();

			}

			// TODO: remove this code
			// path.visible = false;
			// pathWithDefects.visible = true;
			// pathWithDefects.selected = true;
			// end TODO

			return pathWithDefects;
		} else
			return path;
	}

	this.calculateThickness = function calculateThickness() {
		var maxChange = this.seed.thickness.max - this.seed.thickness.min;
		var thickness = easeWithCenter(this.year, this.seed.years, maxChange, 0.3);
		// the min thickness is used as our base
		thickness += this.seed.thickness.min;

		return thickness;
	}

	this.calculateColor = function calculateColor(thickness) {
		return this.seed.type.colorPalate.outerRing;
	}
}


function Illustrator(origin, seedGenerator) {
	this.origin = origin;
	this.seedGenerator = seedGenerator;
	this.seed = seedGenerator.seed;
	this.colorPalate = this.seed.type.colorPalate;

	this.illustrateRing = function illustrateRing(year, path, childPath, options) {

		// draw secondary path based on defect path to create fill
		var outerPath = new paper.Path();
		var innerPath = new paper.Path();
		var darkRingThickness = 0;

		var gap = this.seedGenerator.getGap(year);
		var inGap = false;
		for(var offset=0, len=path.length ; offset < len ; offset+=0.5) {

			var outerPoint = path.getPointAt(offset);
			var childPoint = findIntersectionPointInCircle(childPath, outerPoint, this.origin);

			// get radius of parent point
			var radius = this.origin.getDistance(outerPoint);
			var childRadius = this.origin.getDistance(childPoint);

			// calculate the thickness of the dark portion of ring
			var lightRingThickness = childRadius - radius;
			var darkRingThickness = lightRingThickness * this.seed.thickness.darkPercent;

			// add jitter to rings
			var jitter = darkRingThickness * seedGenerator.nextInRange(-0.11, 0.11);

			options.smoothOuterRing = false;
			if(options.smoothOuterRing)
				jitter = darkRingThickness * seedGenerator.nextInRange(-0.04, 0.04);

			if(darkRingThickness < 2 && Math.abs(jitter) > 0.02)
				jitter = 0.02;
			if(darkRingThickness < 1)
				jitter = 0;

			darkRingThickness += jitter;

			var innerPoint = getPointInCircle(radius - jitter, getAngleInCircle(outerPoint, this.origin), this.origin);
			var outerPoint = getPointInCircle(radius + darkRingThickness, getAngleInCircle(outerPoint, this.origin), this.origin);

			// apply gaps
			var positionPercent = offset / len;
			if(gap) {
				if(!inGap && positionPercent > gap.startPercent && positionPercent < gap.endPercent) {
					inGap = true;
					outerPath.add(this.origin);
					innerPath.add(this.origin);
				}

				if(inGap && positionPercent > gap.endPercent)
					inGap = false;
			}

			if(!inGap) {
				outerPath.add(outerPoint);
				innerPath.add(innerPoint);
			}
		}

		outerPath.fillColor = this.colorPalate.outerRing;
		outerPath.strokeColor = null;

		innerPath.fillColor = this.colorPalate.innerRing;

		// TODO: forget about fade? Think sharper is better
		// use the stroke to fade colors between rings
		// var fadeColor = averageColors(this.colorPalate.outerRing, this.colorPalate.innerRing);
		fadeColor = this.colorPalate.innerRing;

		innerPath.strokeColor = fadeColor;
		outerPath.strokeColor = fadeColor;
		innerPath.strokeWidth = this.seed.thickness.darkPercent * darkRingThickness;

		if(options.smoothOuterRing)
			outerPath.strokeWidth = 0;
		else
			outerPath.strokeWidth = this.seed.thickness.darkPercent * darkRingThickness;

		outerPath.visible = true;
		innerPath.visible = true;

		// send to back was causing an error
		// innerPath.sendToBack();
		// outerPath.sendToBack();

		var ringGroup = new paper.Group([outerPath, innerPath]);
		paper.paper.project.activeLayer.insertChild(0, ringGroup);
		paper.project.activeLayer.insertChild(0, outerPath);

		return outerPath;
	}

	this.illustrateBark = function illustrateBark(barkPath, parentPath) {
		var outerPath = barkPath.clone();
		var innerPath = new paper.Path();

		var outerBarkWidth = this.seedGenerator.nextInRange(5,7)
		for(var offset=0, len=outerPath.length ; offset < len ; offset += this.seedGenerator.nextInRange(10)) {
			var point = outerPath.getPointAt(offset);

			var radius = this.origin.getDistance(point) - outerBarkWidth;
			var radiusDelta = this.seed.bark.roughness * this.seedGenerator.nextInRange(this.seed.bark.thickness.min/2);
			radius += radiusDelta;

			point = getPointInCircle(radius, getAngleInCircle(point, this.origin), this.origin);

			innerPath.add(point);
		}

		// this line is between the bark start and the last dark ring, it doesn't always show
		// since we don't know how wide the last ring ended up being but its kind of cool looking
		var innerOutline = parentPath.clone();
		innerOutline.simplify();
		innerOutline.strokeWidth = 8;
		innerOutline.strokeColor = this.seed.type.colorPalate.outerBark;

		outerPath.fillColor = this.seed.type.colorPalate.outerBark;
		innerPath.fillColor = this.seed.type.colorPalate.innerBark;

		innerPath.closed = true;
		innerPath.visible = true;

		paper.project.activeLayer.insertChild(0, innerOutline);
		paper.project.activeLayer.insertChild(0, innerPath);
		paper.project.activeLayer.insertChild(0, outerPath);
	}

	this.illustrateGrain = function illustrateGrain(outerPath) {

		for(var i=12000 ; i > 0 ; i--) {
			//get angle
			var angle = this.seedGenerator.nextInRange(Math.PI * 2);
			var length = this.seedGenerator.nextInRange(this.seed.thickness.max) / 2;

			if(length < this.seed.thickness.min)
				length = this.seed.thickness.min;

			var intersectionLineEnd = getPointInCircle(1000, angle, this.origin);
			var outerPoint = findIntersectionPointInCircle(outerPath, intersectionLineEnd, this.origin);

			//multiplier * distance to outer path at that angle
			var outerDistance = this.origin.getDistance(outerPoint);
			var startRadius = this.seedGenerator.nextMultiplier() * outerDistance;
			var endRadius = startRadius + length;

			if(endRadius > outerDistance)
				endRadius = outerDistance;

			var startPoint = getPointInCircle(startRadius, angle, this.origin);
			var endPoint = getPointInCircle(endRadius, angle, this.origin);

			var grainPath = new paper.Path([startPoint, endPoint]);
			grainPath.visible = true;
			grainPath.strokeWidth = 0.1;

			grainPath.strokeColor = colorInRangeFromMultiplier(this.seed.type.colorPalate.outerRing,
				this.seed.type.colorPalate.innerRing,
				this.seedGenerator.nextMultiplier());

			//grainPath.strokeColor = this.seed.colorPalate.outerRing;

			grainPath.opacity = this.seedGenerator.nextInRange(0.4, 0.8);
		}
	}

	this.illustrateTitle = function illustrateTitle(outerPath) {
		// determine title start position

		var intersecterPoint = getPointInCircle(1000, 0.7, this.origin);
		var textPoint = findIntersectionPointInCircle(outerPath, intersecterPoint, this.origin);
		var distance = this.origin.getDistance(textPoint);

		// add offset to last ring position
		distance += 60;
		textPoint = adjustPointRadiusInCircle(distance, textPoint, this.origin);

		// set text styles
		var name = new paper.PointText(textPoint);
		name.justification = 'left';
		name.fillColor = 'black';
		name.fontSize = 30;
		name.fontFamily = 'serif';

		var offsetPoint = new paper.Point(name.bounds.bottomLeft);
		offsetPoint.y += 20;
		offsetPoint.x += 5;

		var subtext = new paper.PointText(offsetPoint);
		subtext.justification = 'left';
		subtext.fillColor = 'black';
		subtext.fontSize = 15;
		subtext.fontFamily = 'serif';

		name.content = this.seed.type.name;
		subtext.content = '(' + this.seed.type.scientificName + ')';
	}

	this.illustrateCracks = function illustrateCracks(paths, years) {

		// generate cracks
		// TODO: this should be refactored into main loop
		var cracks = [], crackCount = this.seedGenerator.nextIndex(this.seed.years);
		for (var i=crackCount-1; i >= 0; i--) {
			var start = this.seedGenerator.nextIndex(this.seed.years-3) + 1;
			var end = start + this.seedGenerator.nextIndex(4) + 2;

			if(end >= this.seed.years-1)
				end = this.seed.years-2;

			cracks.push({
				angle:this.seedGenerator.nextInRange(Math.PI * 2),
				width: this.seedGenerator.nextInRange(0.75, 1.3),
				start: start,
				end: end
			});
		}

		var crackPaths = [];
		for(var c=cracks.length-1 ; c >= 0 ; c--) {
			try {
				var crack = cracks[c];

				var crackPoints = [];

				for(var i=crack.start, len=paths.length ; i < len && i < crack.end ; i++) {

					var childPath = paths[i+1].simplePath;
					var parentPath = paths[i].simplePath;

					//change width of cracks slightly
					var width = this.seedGenerator.nextInRange(0.5, crack.width);

					// add jitter to crack angle so that the cracks jump around between  arn't perfectly straight
					var jitter = this.seedGenerator.nextInRange(-2, 2);

					var crackSegmentStart = getPointInCircle(9000, crack.angle, this.origin);

					var parentIntersection = findIntersectionPointInCircle(parentPath, crackSegmentStart, this.origin);
					var childIntersection = findIntersectionPointInCircle(childPath, crackSegmentStart, this.origin);

					// add start node if we are on the first ring or add both points if we aren't at the end point
					if(i === crack.start) {
						crackPoints.push(parentIntersection);
					} else if(i !== crack.end-1) {
						var parentIntersectionOffset = parentPath.getLocationOf(parentIntersection);

						parentIntersectionOffset = parentIntersectionOffset.offset + jitter;

						crackPoints.push(parentPath.getLocationAt(parentIntersectionOffset + width).point);
						crackPoints.unshift(parentPath.getLocationAt(parentIntersectionOffset - width).point);
					}

					// add a single end point or two nodes for all intermediate rings
					if(i === crack.end-1) {
						crackPoints.push(childIntersection);
					} else {
						var childIntersectionOffset = childPath.getLocationOf(childIntersection);

						childIntersectionOffset = childIntersectionOffset.offset + jitter;

						crackPoints.push(childPath.getLocationAt(childIntersectionOffset + width).point);
						crackPoints.unshift(childPath.getLocationAt(childIntersectionOffset - width).point);
					}
				}

				var path = new paper.Path(crackPoints);
				path.strokeColor = this.seed.type.colorPalate.crack;
				path.fillColor = crack.width > 1.2 ? this.seed.colorPalate.deepCrack : this.seed.type.colorPalate.crack;
				path.strokeWidth = crack.width > 1.2 ? crack.width / 2 : crack.width;
				path.closed = true;

				crackPaths.push(path);

			} catch(e) {
				console.log('error drawing crack');
				if(path)
					path.remove();
				continue;
			}
		}

		return crackPaths;
	}
}

function SeedGenerator(input) {
	this.seedDigits = null;
	this.input = input;
	this.seed = null;
	this.index = 0;

	this.generate = function generate(years) {
		// input to generate seed digits to base all the other inputs on
		var hashString = hashInput(this.input);
		for(var i=0 ; i < 10 && hashString.length < 500 ; i++)
			hashString += hashInput(hashString);
		this.seedDigits = hashString.split('');

		var knotCenter = new paper.Point(0, 0);
		var knotPaths = [
			new paper.Path.RegularPolygon(knotCenter, 5, 5),
			new paper.Path.RegularPolygon(knotCenter, 7, 5),
			new paper.Path.RegularPolygon(knotCenter, 11, 5),
			new paper.Path.RegularPolygon(knotCenter, 21, 5),
			new paper.Path.Star(knotCenter, 13, 5, 6),
			new paper.Path.Star(knotCenter, 21, 5, 6),
		];

		var index = this.nextIndex(knotPaths.length);
		//index = 5;
		var knotPath = knotPaths[index];

		knotPath.shear(this.nextInRange(0.1));
		knotPath.rotate(this.nextInRange(360));
		knotPath.smooth();

		// max thickness is between 10-35, min is 6-10
		var maxThickness = 11 + this.nextInRange(10);
		var minThickness = 5 + this.nextInRange(5);

		// ring gaps occur in a low number of rings
		var gapableYears = years > 12 ? 12 : years;

		var gaps=[], gapCount = Math.round(gapableYears * this.nextInRange(0.75));
		for (var i=gapCount-1; i >= 0; i--) {
			var gap = {};
			gap.year = this.nextIndex(gapableYears) + 1;
			gap.startPercent = this.nextInRange(0.75);
			gap.endPercent = gap.startPercent;
			gap.endPercent += gap.year < 6 ? this.nextInRange(0.01, 0.07) : this.nextInRange(0.01, 0.04);
			gaps.push(gap);
		}

		var seedType = seedTypes[this.nextIndex(seedTypes.length)];

		this.seed = {
			name: this.input,
			thickness: {
				max: maxThickness,
				min: minThickness,
				darkPercent: 0.3 + this.nextInRange(0.15)
			},
			knotPath: knotPath,
			gaps: gaps,
			years: years,
			type: seedType,
			colorPalate: seedType.colorPalate,
			bark: seedType.bark,
			environment: this.generateEnvironment(years)
		};

		return this.seed;
	}

	this.generateEnvironment = function generateEnvironment(years) {
		var environment = [];

		// We always add a main defect that spans the entire lifespan
		environment.push({start:1, end: years-1, power: this.nextInRange(0.5, 0.7), angle : this.nextInRange(Math.PI * 2), type:'sun'});
		var sunEnvCount = 0;
		for(var i=0, len=this.nextInRange(10,25); i < len ; i++) {
			var end = years-1;
			var start = Math.round(this.nextInRange(1, end-1));
			end = Math.round(this.nextInRange(start+1, end));
			var power = this.nextInRange(0.4, 0.6) * (this.nextBoolean() ? -1 : 1);

			 if(end - start < 5 && end + 6 < years)
			 	end = start + 5;

			var e = {
				start : start,
				end   : end,
				power : power,
				angle : this.nextInRange(0, Math.PI * 2)};

			// Limit sun factors to 3 to prevent crazyness
			if(this.nextMultiplier() > 0.1 || sunEnvCount > 3) {
				e.type = 'defect';
				e.shape = this.nextBoolean() ? 'circle' : 'triangle';
			} else {
				sunEnvCount += 1;
				e.type = 'sun';
			}
			environment.push(e);
		}

		return environment;
	}

	this.getGap = function getGap(year) {
		for(var i=this.seed.gaps.length-1 ; i >= 0 ; i--) {
			if(this.seed.gaps[i].year === year)
				return this.seed.gaps[i];
		}
		return null;
	}

	this.getEnvironmentState = function getEnvironmentState(year) {
		var growthFactors = [], defects = [];

		for(var i=0, len=this.seed.environment.length ; i < len ; i++) {
			var e = this.seed.environment[i];

			if(e.start <= year && e.end > year) {
				var item = JSON.parse(JSON.stringify(e));
				item.power = ease(year - item.start, item.end - item.start, item.power);

				(item.type === 'sun' ? growthFactors : defects).push(item);
			}
		}

		return {growthFactors: growthFactors, defects: defects};
	}

	this.getSeed = function getSeed() {
		return this.seed;
	}

	this.nextMultiplier = function nextMultiplier() {
		return this.nextInRange(1);
	}

	this.nextBoolean = function nextBoolean() {
		return this.nextMultiplier() >= 0.5;
	}

	this.nextIndex = function nextIndex(maxIndex) {
		maxIndex -= 1;
		return Math.round(this.nextInRange(maxIndex));
	}

	this.nextInRange = function nextInRange(start, end) {
		if(end === undefined) {
			end = start;
			start = 0;
		}
		var range = end - start;
		var percent = 0;
		for(var multiplier = 1 ; multiplier < 1001 ; multiplier *= 10)
			percent += this.nextDigit() * multiplier;
		percent /= 10000;

		return start + (range * percent);
	}

	this.nextDigit = function nextDigit() {
		if(this.index >= this.seedDigits.length - 1)
			this.index = 0;
		else
			this.index += 1;

		return this.seedDigits[this.index];
	}
}

function easeWithCenter(now, duration, maxValue, center) {

	if(!center)
		center = 0.5;

	var rc;
	if(now > (duration * center)) {
		now -= duration * center;
		duration *= 1-center;
		rc = maxValue * (1-(now/duration));
		//rc = maxValue * Math.sin(now/duration * (Math.PI/2));

	} else {
		duration *= center;
		//rc = maxValue * (now/duration);
		rc = -maxValue * Math.cos(now/duration * (Math.PI/2)) + maxValue;
	}

	return rc;
}

function ease(now, duration, maxValue) {
	// EXPONENTIAL EASING (Looks worse I think)
	//var x = now / duration * 2;
	//return (1 - Math.pow(x-1, 2)) * maxValue;

	duration /= 2;

	var rc;
	if(now > duration) {
		now -= duration;
		rc = maxValue * (1-(now/duration));
	} else
		rc = maxValue * (now/duration);

	return rc;
}


function drawEnvironment(environment) {
	var originPath = new paper.Path.Circle(origin, 1);
	originPath.selected = true;

	for(var g in environment) {
		var growthFactor = environment[g];

		var path = new paper.Path();
		path.add(origin);
		path.add(getPointInCircle(400, growthFactor.angle, origin));

		if(growthFactor.type === 'sun')
			path.strokeColor = 'green';
		else
			path.strokeColor = 'red';
	}
}

//angle is in radians
function getPointInCircle(radius, angle, origin) {
    var x = origin.x + radius * Math.cos(angle);
	var y = origin.y + radius * Math.sin(angle);

    return new paper.Point(x, y);
}

//angle is in radians
function adjustPointRadiusInCircle(radius, point, origin) {
	var angle = getAngleInCircle(point, origin);

	var adjustedPoint = new paper.Point();
    adjustedPoint.x = origin.x + radius * Math.cos(angle);
	adjustedPoint.y = origin.y + radius * Math.sin(angle);

	return adjustedPoint;
}

function getAngleInCircle(point, origin) {
    return Math.atan2(point.y - origin.y, point.x - origin.x);
}

function findIntersectionPointInCircle(circlePath, point, origin) {
	var angle = getAngleInCircle(point, origin);

	var radiusPath = new paper.Path([origin,
		getPointInCircle(1000, angle, origin)]);

	// Get intersection between ring and defect line
	var intersectionLocation = circlePath.getIntersections(radiusPath)[0];

	// Think there is a bug in get intersection where it misses if there is a point
	// https://github.com/paperjs/paper.js/issues/477
	if(!intersectionLocation) {

		// circlePath.visible = true;
		// circlePath.selected = true;
		// point.visible = true;
		// point.selected = true;


		//intersectionLocation = circlePath.getNearestLocation(point);

		if(!intersectionLocation) {

			var nearestPoint = null, distance;
			for(var i=0, len=circlePath.segments.length ; i < len ; i++) {
				var p = circlePath.segments[i].point;
				var pDistance = Math.abs(point.x - p.x) + Math.abs(point.y - p.y);

				if(!nearestPoint || pDistance < distance) {
					nearestPoint = p;
					distance = pDistance;
				}
			}

			if(distance > 30) {
				console.log('nearest point was pretty far away ' + distance);
			}
			return nearestPoint;
		}
	}

	if(!intersectionLocation) {
		radiusPath = new paper.Path([origin,getPointInCircle(10000, angle, origin)])
		radiusPath.visible = true;
		radiusPath.selected = true;
		console.log('intersection not found');

			throw 'error intersection';
		return;
	}
	//radiusPath.remove();
	return intersectionLocation.point;
}

function averageColors(color1, color2) {
	var c1 = color1.substring(1).match(/[\da-z]{2}/gi);
	var c2 = color2.substring(1).match(/[\da-z]{2}/gi);

	var avg = [];
	for(var i=0 ; i < 3 ; i++)
		avg.push((parseInt(c1[i], 16) + parseInt(c2[i], 16)) / 2);

	return avg.reduce(function(p, c) {
		return p + Math.round(c).toString(16);
	}, '#');
}

function colorInRangeFromMultiplier(color1, color2, multiplier) {
	var c1 = color1.substring(1).match(/[\da-z]{2}/gi);
	var c2 = color2.substring(1).match(/[\da-z]{2}/gi);

	var newColor = [];
	for(var i=0 ; i < 3 ; i++) {
		var colorHex1 = parseInt(c1[i], 16);
		var colorHex2 = parseInt(c2[i], 16);

		if(colorHex1 > colorHex2) {
			var temp = colorHex1;
			colorHex1 = colorHex2;
			colorHex2 = temp;
		}

		var hexDelta = Math.abs(colorHex2 - colorHex1);
		var colorHex = Math.round(hexDelta * multiplier);
		colorHex += colorHex1;

		newColor.push(colorHex);
	}

	return newColor.reduce(function(p, c) {
		return p + c.toString(16);
	}, '#');
}

function hashInput(str) {
    var hash = 0;
    var output = [];
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);

        hash += char + (hash << 6) + (hash << 16) - hash
        output.push(Math.abs(hash));
        output.push(char);
    }
    return output.join('');
}
