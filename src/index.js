
/// <reference path="C:\Users\lucas\OneDrive\Documents\openrct2-dev\OpenRCT2\distribution\openrct2.d.ts" />

import GameCommandType from './defines'

ownedMapCoordsInit = false;
ownedMapCoordsMap = []
cursorSize = 4;
cursorMapCoords = []
lastCursorPosition = {}

function onQuery(Args){
	if(Args.type != GameCommandType.TogglePause || Args.type != GameCommandType.LoadOrQuit){
		result = Args.result;
		
		if(result.position != null){
			coords = Args.result.position;
			coords = {x: Math.floor(coords.x/32), y:Math.floor(coords.y/32)};
			coords = {x: coords.x * 32, y: coords.y * 32};

			tileOwned = ownedMapCoordsMap[coords.x][coords.y].owned;
			
			if(tileOwned == false)
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
	for(index = 0; index < cursorMapCoords.length; index++)
	{
		coord = cursorMapCoords[index];

		if(!ownedMapCoordsMap[coord.x][coord.y].owned){
			ownedMapCoordsMap[coord.x][coord.y].owned = true;
			tiles.push(coord);
		}
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
		if(ownedMapCoordsMap[coord.x][coord.y].owned){
			toRemove.push(coord);
			ownedMapCoordsMap[coord.x][coord.y].owned = false;
		}
	}

	tiles = ui.tileSelection.tiles;
	for(index = 0; index < toRemove.length; index++){
		found = false;
		j = 0;
		coord1 = toRemove[index];

		for(j = 0; j < tiles.length; j++){
			coord2 = tiles[j];

			if(coord1.x == coord2.x && coord1.y == coord2.y){
				found = true;
				break;
			}
		}

		if(found){
			tiles.splice(j,1);
		}
		
	}
	ui.tileSelection.tiles = tiles;
	
}

function updateTool(args)
{
	if(setToOwnedLand)
		addTiles(args);
	else
		removeTiles(args);
	needRefresh = true;
}
function onLandPermissionToolDown(args){
	updateTool(args);
	lastCursorPosition = args.mapCoords;
}

minX = 0;
maxX = 0;
minY = 0;
maxY = 0;
needRefresh = false;
function updateCursorPosition(args)
{
	//update the cursor
	mapCoords = args.mapCoords;

	//transform into tile coordinates
	tileCoords = {x:Math.floor(mapCoords.x/32),y:Math.floor(mapCoords.y/32)};

	//clear the cursor map coords
	cursorMapCoords = [];

	minX = Math.max(0, mapCoords.x - cursorSize*16 + 16);
	minX = Math.floor(minX/32);

	minY = Math.max(0, mapCoords.y - cursorSize*16 + 16);
	minY = Math.floor(minY/32);

	maxX = Math.min((map.size.x-1)*32, mapCoords.x + cursorSize*16 - 16);
	maxX = Math.floor(maxX/32);

	maxY = Math.min((map.size.y-1)*32, mapCoords.y + cursorSize*16 - 16);
	maxY = Math.floor(maxY/32);

	minX = minX * 32;
	maxX = maxX * 32;
	minY = minY * 32;
	maxY = maxY * 32;

	//push the map coordinates of the tool cursor
	if(needRefresh){
		oldTiles = []
		for(i = 0; i < map.size.x*32; i += 32){
			for(j = 0; j < map.size.y*32; j += 32){
				if(ownedMapCoordsMap[i][j].owned){
					oldTiles.push(ownedMapCoordsMap[i][j].coords);
				}
			}
		}
		needRefresh = false;
		
	}
	ui.tileSelection.tiles = oldTiles;
	tiles = ui.tileSelection.tiles;

	for(i = minX; i <= maxX; i+=32)
	{
		for(j = minY; j <= maxY; j+=32)
		{
			coord = {x: i, y: j};
			cursorMapCoords.push(coord);
			tiles.push(coord);
		}
	}
	ui.tileSelection.tiles = tiles;
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

function initOwnedMapCoords(){
	for(i = 0; i < map.size.x*32; i += 32){
		ownedMapCoordsMap[i] = []
		for(j = 0; j < map.size.y*32; j += 32){
			ownedMapCoordsMap[i][j] = {owned: false, coords: {x:i, y:j}};
		}
	}
	lastMapSize = map.size;
}

lastMapSize = 0;
function onTick(){
	if(lastMapSize.x != map.size.x || lastMapSize.y != map.size.y)
		initOwnedMapCoords();
}
function main() {
	context.subscribe("action.query",onQuery);

	initOwnedMapCoords();
	console.log("map initialized");
	
	if (typeof ui === 'undefined') {
        return;
    }
	setToOwnedLand = true;
	
	//ui to permit land
	ui.registerMenuItem("Land permissions editor", openLandPermissionWindow);

	//check if the map size has changed
	context.subscribe("interval.tick", onTick);
	
	return;
	
}

registerPlugin({
    name: 'PlayerTerritory',
    version: '1.0',
    authors: ['Frutiemax'],
    type: 'remote',
    main: main
});

