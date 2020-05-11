
/// <reference path="C:\Users\lucas\OneDrive\Documents\openrct2-dev\OpenRCT2\distribution\openrct2.d.ts" />

import GameCommandType from './defines'

ownedMapCoordsInit = false;
ownedMapCoords = []
cursorSize = 4;
cursorMapCoords = []
lastCursorPosition = {}

test = GameCommandType.SetRideAppearance;

function onQuery(Args){
	if(Args.type != GameCommandType.TogglePause || Args.type != GameCommandType.LoadOrQuit){
		result = Args.result;
		
		if(result.position != null){
			coords = Args.result.position;
			coords = {x: Math.floor(coords.x/32), y:Math.floor(coords.y/32)};
			coords = {x: coords.x * 32, y: coords.y * 32};

			tileOwned = ownedMapCoords.indexOf(coords);
			
			if(tileOwned == -1)
			{
				result.error = 1;
				result.errorTitle = "Construction is not allowed outside of holy land";
			}
		}
		
	}
}

setToOwnedLand = true;
function onLandButtonToggleClick(){
	if(setToOwnedLand == false){
		setToOwnedLand = true;
	}
	else{
		setToOwnedLand = false;
	}
}

function onLandPermissionWindowClose(){
}

function onIncrementCursorSize(){
	cursorSize++;

	//update the text
	updateCursorSizeText();
}

function onDecrementCursorSize(){
	cursorSize--;
	if(cursorSize == 0)
		cursorSize = 1;

	//update the text
	updateCursorSizeText();
}

function updateCursorSizeText(){
	window = ui.getWindow("land_permissions")

	spinner = window.findWidget("cursor_size_spinner");
	spinner.text = cursorSize + "x" + cursorSize;
}

function openLandPermissionWindow(){
	
	landButton = {
		type: "button",
		x : 250,
		y: 250,
		width : 46,
		height : 12,
		name: "land_editor_toggle",
		onClick: onLandButtonToggleClick,
		text : "Land"
	};

	cursorSizeWidget = {
		type: "spinner",
		x : 150,
		y: 250,
		width : 80,
		height : 12,
		name: "cursor_size_spinner",
		text : "1x1",
		onDecrement: onDecrementCursorSize,
        onIncrement: onIncrementCursorSize
	}
	
	landEditor = ui.openWindow({
		classification: "land_permissions",
		x: 500,
		y: 500,
		width: 300,
		height: 300,
		title:"Land Permissions Editor",
		minWidth: 100,
		minHeight: 50,
		widgets: [landButton,cursorSizeWidget],
		colours: [200],
		isSticky: true,
		
		onClose: onLandPermissionWindowClose
	});
	
	landPermissionToolDesc = {
		id : "land_permissions_tool",
		cursor : "fence_down",
		onDown : onLandPermissionToolDown,
		onMove : onLandPermissionToolMove,
	};
	
	//show tool
	ui.activateTool(landPermissionToolDesc);
	updateCursorSizeText();
}

function addTiles(args)
{
	//add the cursor tiles
	toAdd = []
	for(index = 0; index < cursorMapCoords.length; index++)
	{
		coord = cursorMapCoords[index];
		found = false;

		for(j = 0; j < ownedMapCoords.length; j++)
		{
			coord2 = ownedMapCoords[j];
			if(coord2.x == coord.x && coord2.y == coord.y)
			{
				found = true;
				break;
			}
		}
		if(!found){
			ownedMapCoords.push(coord);
			toAdd.push(index);
		}
		
	}

	tiles = ui.tileSelection.tiles;
	for(index = 0; index < toAdd.length; index++){
		tiles.push(cursorMapCoords[toAdd[index]]);
	}
	ui.tileSelection.tiles = tiles;
}

function removeTiles(args)
{
	//remove tiles
	toRemove = []
	for(index = 0; index < cursorMapCoords.length; index++)
	{
		coord = cursorMapCoords[index];
		coord2 = {};

		j = 0;
		for(j = 0; j < ownedMapCoords.length; j++)
		{
			coord2 = ownedMapCoords[j];
			if(coord2.x == coord.x && coord2.y == coord.y)
			{
				found = true;
				break;
			}
		}

		if(found){
			ownedMapCoords.splice(j,1);
			toRemove.push(coord2);
		}
	}

	tiles = ui.tileSelection.tiles;
	for(index = 0; index < toRemove.length; index++){
		found = false;
		j = 0;
		for(j = 0; j < tiles.length; j++){
			coord1 = toRemove[index];
			coord2 = tiles[j];

			if(coord1.x == coord2.x && coord1.y == coord2.y){
				found = true;
				break;
			}
		}
		tiles.splice(j,1);
	}
	ui.tileSelection.tiles = tiles;
}

function updateTool(args)
{
	if(setToOwnedLand)
		addTiles(args);
	else
		removeTiles(args);
}
function onLandPermissionToolDown(args){
	updateTool(args);
	lastCursorPosition = args.mapCoords;
}

function updateCursorPosition(args)
{
	//update the cursor
	mapCoords = args.mapCoords;

	//transform into tile coordinates
	tileCoords = {x:Math.floor(mapCoords.x/32),y:Math.floor(mapCoords.y/32)};

	//clear the cursor map coords
	cursorMapCoords = []

	//get the min,max x and y coordinates
	if((cursorSize % 2) != 0)
	{
		minX = Math.max(0, tileCoords.x - (cursorSize-1)/2);
		minY = Math.max(0, tileCoords.y - (cursorSize-1)/2);
		maxX = Math.min(map.size.x-1, tileCoords.x + (cursorSize-1)/2);
		maxY = Math.min(map.size.y-1, tileCoords.y + (cursorSize-1)/2);
	}
	else
	{
		minX = Math.max(0, mapCoords.x - cursorSize*16 + 16);
		minX = Math.floor(minX/32);

		minY = Math.max(0, mapCoords.y - cursorSize*16 + 16);
		minY = Math.floor(minY/32);

		maxX = Math.min((map.size.x-1)*32, mapCoords.x + cursorSize*16 - 16);
		maxX = Math.floor(maxX/32);

		maxY = Math.min((map.size.y-1)*32, mapCoords.y + cursorSize*16 - 16);
		maxY = Math.floor(maxY/32);
	}

	//push the map coordinates of the tool cursor
	for(i = minX; i <= maxX; i++)
	{
		for(j = minY; j <= maxY; j++)
		{
			coord = {x: i*32, y: j*32};
			coord.x = Math.floor(coord.x/32)*32;
			coord.y = Math.floor(coord.y/32)*32;
			cursorMapCoords.push(coord);
		}
	}

	//update the highlighted cursor tiles
	ui.tileSelection.tiles = ownedMapCoords;
	tilesSelected = ui.tileSelection.tiles;
	for(index = 0; index < cursorMapCoords.length; index++){
		tilesSelected.push(cursorMapCoords[index]);
	}
	ui.tileSelection.tiles = tilesSelected;
}
function onLandPermissionToolMove(args){
	if(args.mapCoords.x != lastCursorPosition.x || args.mapCoords.y != lastCursorPosition.y)
	{
		updateCursorPosition(args);
		if(args.isDown){
			updateTool(args);
		}
	}
	lastCursorPosition = args.mapCoords;
}


function main() {
	context.subscribe("action.query",onQuery);
	
	if (typeof ui === 'undefined') {
        return;
    }
	setToOwnedLand = true;
	
	//ui to permit land
	ui.registerMenuItem("Land permissions editor", openLandPermissionWindow);
	
	return;
	
}

registerPlugin({
    name: 'PlayerTerritory',
    version: '1.0',
    authors: ['Frutiemax'],
    type: 'remote',
    main: main
});

