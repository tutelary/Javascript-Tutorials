/**
 * Created by krishnachaitanyaamjuri on 18/08/16.
 */

/*
 Namely, a world will be a two-dimensional grid where each entity takes up one full square of the grid.
 On every turn, the critters all get a chance to take some action
 */

function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.plus = function (otherVector) {
    return new Vector(this.x + otherVector.x, this.y + otherVector.y);
};

// var grid = ["top left", "top middle", "top right", "bottom left", "bottom middle", "bottom right"];
// console.log(grid[2 + (1*3)]); // a single array with size width*height, element at (x, y) can be found at (x + y*width)

function Grid(width, height) {
    this.space = new Array(width * height);
    this.width = width;
    this.height = height;
}

Grid.prototype.isInside = function (vector) {
    return (vector.x >= 0 && vector.x < this.width) && (vector.y >= 0 && vector.y < this.height);
};
Grid.prototype.get = function (vector) {
    return this.space[vector.x + this.width * vector.y];
};
Grid.prototype.set = function (vector, value) {
    this.space[vector.x + this.width * vector.y] = value;
}

// var grid = new Grid(5, 5);
// console.log(grid.get(new Vector(1, 1)));
// grid.set(new Vector(1, 1), 'X');
// console.log(grid.get(new Vector(1, 1)));

var directions = {
    'n':  new Vector(0, -1),
    'ne': new Vector(1, -1),
    'e':  new Vector(1, 0),
    'w':  new Vector(-1, 0),
    's':  new Vector(0, 1),
    'se': new Vector(1, 1),
    'nw': new Vector(-1, -1),
    'sw': new Vector(1, 1)
}

var directionNames = "n ne e se s sw w nw".split(" ");

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function BouncingCritter() {
    this.direction = randomElement(directionNames);
}

BouncingCritter.prototype.act = function (view) {
    if (view.look(this.direction) != " ") {
        this.direction = view.find(" ") || "s";
    }
    return {type: "move", direction: this.direction};
};

function elementFromChar(legend, ch) {
    if (ch == ' ') {
        return null;
    }
    var element = new legend[ch]();
    element.originChar = ch;
    return element;
}

function charFromElement(element) {
    if(element == null) {
        return " ";
    }else {
        return element.originChar;
    }
}

function World(map, legend) {
    var grid = new Grid(map[0].length, map.length);
    this.grid = grid;
    this.legend = legend;

    map.forEach(function (line, y) {
        for (var x = 0; x < line.length; x++) {
            grid.set(new Vector(x, y), elementFromChar(legend, line[x]));
        }
    });
}

Grid.prototype.ForEach = function (f, context) {
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            var value = this.space[x + y * this.width];
            if(value != null) {
                f.call(context, value, new Vector(x, y));
            }
        }
    }
}

World.prototype.toString = function () {
    var output = "";
    for(var y = 0; y < this.grid.height; y++) {
        for(var x = 0; x < this.grid.width; x++) {
            var element = this.grid.get(new Vector(x, y));
            output += charFromElement(element);
        }
        output += '\n';
    }
    return output;
};

// Wall is a simple object with no methods
function Wall() {
    
}

/*
    Usecase of bind():- Bind creates a new function that will have 'this' set to the first parameter passed to bind()
    Example is as given below
 */

/*
function printStrikeRateOfBowler() {
    var strikeRate = this.oversBowled/this.wicketsTaken;
    console.log('StrikeRate of ' + this.name + ' is ' + strikeRate);
}

var MShami = {name: 'Mohammed Shami', oversBowled: 3201, wicketsTaken: 58};
var RAsh = {name: 'Ravichandran Ashwin', oversBowled: 9980, wicketsTaken: 192};

var printMShamiSR = printStrikeRateOfBowler.bind(MShami);
printMShamiSR();

var printRAshSR = printStrikeRateOfBowler.bind(RAsh);
printRAshSR();
*/

function View(world, vector) {
    this.world = world;
    this.vector = vector;
}

View.prototype.look = function (dir) {
    var target = this.vector.plus(directions[dir]);
    if(this.world.grid.isInside(target)) {
        return charFromElement(this.world.grid.get(target));
    }else {
        return '#';
    }
}

View.prototype.findAll = function (ch) {
    var found = [];
    for(var dir in directions) {
        if(this.look(dir) == ch) {
            found.push(dir);
        }
    }
    return found;
}

View.prototype.find = function (ch) {
    var found = this.findAll(ch);
    if(found.length == 0) {
        return null;
    }else {
        return randomElement(found);
    }
}

World.prototype.checkDestination = function (action, vector) {
    if(directions.hasOwnProperty(action.direction)) {
        var dest = vector.plus(directions[action.direction]);
        if(this.grid.isInside(dest)) {
            return dest;
        }
    }
}

World.prototype.letAct = function (critter, vector) {
    var action = critter.act(new View(this, vector));
    if(action && action.type == 'move') {
        var dest = this.checkDestination(action, vector);
        if(dest && this.grid.get(dest) == null) {
            this.grid.set(vector, null);
            this.grid.set(dest, critter);
        }
    }
};

World.prototype.turn = function () {
    var acted = [];
    this.grid.ForEach(function (critter, vector) {
        if(critter.act && acted.indexOf(critter) == -1) {
            acted.push(critter);
            this.letAct(critter, vector);
        }
    }, this);
};

var plan = ["############################",
            "#      #    #      o      ##",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"]; // # represents wall, o represents critters

var world = new World(plan, {"#": Wall, "o": BouncingCritter});
// console.log(world.toString());

//dirPlus('n', 1) = 45 degree turn clockwise from north = 'ne'
function dirPlus(dir, n) {
    var index = directionNames.indexOf(dir);
    return directionNames[(index + n + 8)%8];
}

function WallFollower() {
    this.dir = 's';
}

WallFollower.prototype.act = function(view) {
    var start = this.dir;
    if(view.look(dirPlus(this.dir, -3)) != " ") {
        start = this.dir = dirPlus(this.dir, -2);
    }
    while (view.look(this.dir) != " ") {
        this.dir = dirPlus(this.dir, 1);
        if(this.dir == start) {
            break;
        }
    }
    return {type: 'move', direction: this.dir};
}

// for(var i = 0; i < 20; i++) {
//     world.turn();
//     console.log(world.toString());
// }

/*
Using call function, you can pass the current context to the constructor.
 */
function LifeLikeWorld(map, legend) {
    World.call(this, map, legend);
}
LifeLikeWorld.prototype = Object.create(World.prototype);

var actionTypes = Object.create(null);

LifeLikeWorld.prototype.letAct = function (critter, vector) {
    var action = critter.act(new View(this, vector));
    var handled = action && action.type in actionTypes && actionTypes[action.type].call(this, critter, vector, action);
    if(!handled) {
        critter.energy -= 0.2;
        if(critter.energy <= 0) {
            this.grid.set(vector, null);
        }
    }
};

actionTypes.grow = function (critter) { // for type: plant
    critter.energy += 0.5;
    return true;
};

actionTypes.move = function (critter, vector, action) {
    var dest = this.checkDestination(action, vector);
    if(dest == null || critter.energy <= 1 || this.grid.get(dest) != null) {
        return false;
    }
    critter.energy -= 1;
    this.grid.set(vector, null);
    this.grid.set(dest, critter);
    return true;
};

actionTypes.eat = function (critter, vector, action) {
    var dest = this.checkDestination(action, vector);
    var atDest = (dest != null);
    if(atDest) {
        if(this.grid.get(dest).energy != null) {
            critter.energy += this.grid.get(dest).energy;
            this.grid.set(dest, null);
            return true;
        }
    }
    return false;
}

actionTypes.reproduce = function (critter, vector, action) {
    var baby = elementFromChar(this.legend, critter.originChar);
    var dest = this.checkDestination(action, vector);
    if(dest == null || critter.energy <= 2*baby.energy || this.grid.get(dest) != null) {
        return false;
    }
    critter.energy -= 2*baby.energy;
    this.grid.set(dest, baby);
    return true;
};

function Plant() {
    this.energy = 3 + Math.random() * 4;
}

Plant.prototype.act = function(context) {
    if(this.energy > 15) {
        var space = context.find(" ");
        if(space) {
            return {type: "reproduce", direction: space};
        }
    }
    if(this.energy < 20) {
        return {type: "grow"};
    }
}

function PlantEater() {
    this.energy = 20;
}

PlantEater.prototype.act = function(context) {
    var space = context.find(" ");
    if(this.energy > 60 && space) {
        return {type: "reproduce", direction: space};
    }
    var plant = context.find("*");
    if(plant) {
        if(this.energy <= 60) {
            return {type: "eat", direction: plant};
        }
    }
    if(space) {
        return {type: "move", direction: space};
    }
}

var lifeLikeWorldMap = ["############################",
                        "#####                 ######",
                        "##  O***                **##",
                        "#   *##**         **  O  *##",
                        "#    ***          ##**    *#",
                        "#                 ##***    #",
                        "#                 ##**     #",
                        "#  OO       #*O            #",
                        "#*          #**            #",
                        "#***        ##**        O**#",
                        "##****     ###***       *###",
                        "############################"];
var lifeLikeWorldLegend = {"#": Wall,
                            "O": PlantEater,
                            "*": Plant};

var valley = new LifeLikeWorld(lifeLikeWorldMap, lifeLikeWorldLegend);

// for(var i = 0; i < 25; i++) {
//     valley.turn();
//     console.log(valley.toString());
// }




