
/// <reference path="C:\Users\lucas\OneDrive\Documents\openrct2-dev\OpenRCT2\distribution\openrct2.d.ts" />

import GameCommandType from './defines'

ownedMapCoords = []
cursorSize = 2;
cursorMapCoords = []

test = GameCommandType.SetRideAppearance;

function isTileOwned(coords){
	found = false;
	index = 0;
	
	for(index = 0; index < ownedMapCoords.length; index++){
		if(ownedMapCoords[index].x == coords.x && 
			ownedMapCoords[index].y == coords.y){
			found = true;
			break;
		}
	}
	return {found, index};
}

function onQuery(Args){
	if(Args.type != GameCommandType.TogglePause || Args.type != GameCommandType.LoadOrQuit){
		result = Args.result;
		
		if(result.position != null){
			coords = Args.result.position;
			coords = {x: Math.floor(coords.x/32), y:Math.floor(coords.y/32)};
			coords = {x: coords.x * 32, y: coords.y * 32};
			tileOwned = isTileOwned(coords);
			
			if(tileOwned.found == false)
			{
				result.error = 1;
				result.errorTitle = "Construction is not allowed outside of holy land";
			}
		}
		
	}
}

setToOwnedLand = true;
function onLandButtonToggleClick(){
	if(setToOwnedLand == false)
	{
		setToOwnedLand = true;
	}
	else
	{
		setToOwnedLand = false;
	}
	console.log(setToOwnedLand);
}

function onLandPermissionWindowClose(){
	ui.tool.cancel();
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
		text : "1x1"
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
	
	//show owned tiles
	ui.tileSelection.tiles = ownedMapCoords;
}

function addTiles(args)
{
	//add the cursor tiles
	toAdd = []
	for(index = 0; index < cursorMapCoords.length; index++)
	{
		found = false;
		coord2 = cursorMapCoords[index];
		j = 0;
		for(j = 0; j < ownedMapCoords.length; j++)
		{
			coord1 = ownedMapCoords[j];
			if(coord1.x == coord2.x && coord1.y == coord2.y)
			{
				found = true;
				break;
			}
		}
		if(found == false){
				//add it to add list
				toAdd.push(coord2);
		}
	}
	for(index = 0; index < toAdd.length; index++){
		ownedMapCoords.push(toAdd[index]);
	}
}

function removeTiles(args)
{
	//remove tiles
	console.log("removing tiles");
	for(index = 0; index < cursorMapCoords.length; index++)
	{
		coord1 = cursorMapCoords[index];
		for(j = 0; j < ownedMapCoords.length; j++)
		{
			coord2 = ownedMapCoords[j];

			if(coord1.x == coord2.x && coord1.y == coord2.y){
				//splice the array
				ownedMapCoords.splice(j,1);
				break;
			}
		}
	}
}

function updateTool(args)
{
	if(setToOwnedLand)
		addTiles(args);
	else
		removeTiles(args);
	//update the selection
	console.log("update selection");

	ui.tileSelection.tiles = cursorMapCoords;
	tiles = ui.tileSelection.tiles;
	for(index = 0; index < ownedMapCoords.length; index++)
		tiles.push(ownedMapCoords[index]);

	ui.tileSelection.tiles = tiles;
}
function onLandPermissionToolDown(args){
	updateTool(args);
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
		minX = Math.max(0, mapCoords.x - cursorSize*32 + 16);
		minX = Math.floor(minX/32);

		minY = Math.max(0, mapCoords.y - cursorSize*32 + 16);
		minY = Math.floor(minY/32);

		maxX = Math.min((map.size.x-1)*32, mapCoords.x + cursorSize*32 - 16);
		maxX = Math.floor(maxX/32);

		maxY = Math.min((map.size.y-1)*32, mapCoords.y + cursorSize*32 - 16);
		maxY = Math.floor(maxY/32);
	}

	//push the map coordinates of the tool cursor
	for(i = minX; i <= maxX; i++)
	{
		for(j = minY; j <= maxY; j++)
		{
			coord = {x: i*32, y: j*32};
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
	updateCursorPosition(args);

	if(args.isDown)
		updateTool(args);
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

