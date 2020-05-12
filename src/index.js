
/// <reference path="C:\Users\lucas\OneDrive\Documents\openrct2-dev\OpenRCT2\distribution\openrct2.d.ts" />

import GameCommandType from './defines'

ownedMapCoordsInit = false;
mapCoordsOwned = [];
players = [];
isPlayerOnline = []


cursorSize = 4;
cursorMapCoords = []
lastCursorPosition = {}

function onQuery(Args){
	if(Args.type != GameCommandType.TogglePause && Args.type != GameCommandType.LoadOrQuit){
		result = Args.result;
		
		if(result.position != null){
			coords = Args.result.position;
			coords = {x: Math.floor(coords.x/32), y:Math.floor(coords.y/32)};
			coords = {x: coords.x * 32, y: coords.y * 32};

			tileOwned = isOwned(network.currentPlayer, coords.x, coords.y);
			
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
	ui.tool.cancel();
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

players = []
selectedPlayer = 0;
function onPlayerDropDownChanged(index){
	selectedPlayer = index;
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

	playerDropDown = {
		type : "dropdown",
		x : 100,
		y : 200,
		width : 150,
		height : 12,
		name : "player_dropdown",
		text : "Players",
		items : [],
		selectedIndex : 0,
		onChange : onPlayerDropDownChanged
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
		widgets: [landButton,cursorSizeWidget, playerDropDown],
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

	
	if(network.mode == "server" || network.mode == "none"){
		addPlayer(network.currentPlayer);
		selectedPlayer = network.currentPlayer.id;
	}
}

function addTiles(args, player)
{
	//add the cursor tiles
	tiles = ui.tileSelection.tiles;
	for(i = 0; i < cursorMapCoords.length; i++){
		coord = cursorMapCoords[i];
		setOwned(player, coord.x,coord.y,true);
	}
	tiles = [];
	for(i = 0; i < mapCoordsOwned[player].length; i++){
		if(mapCoordsOwned[player][i] == true){
			coord = getCoords(i);
			tiles.push(coord);
		}
	}
	ui.tileSelection.tiles = tiles;
}

function removeTiles(args, player)
{
	for(i = 0; i < cursorMapCoords.length; i++)
	{
		coord = cursorMapCoords[i];
		setOwned(player, coord.x,coord.y,false);
	}
	tiles = [];
	for(i = 0; i < mapCoordsOwned[player].length; i++){
		if(mapCoordsOwned[player][i] == true){
			coord = getCoords(i);
			tiles.push(coord);
		}
	}
	ui.tileSelection.tiles = tiles;
	
}

function updateTool(args, player)
{
	if(setToOwnedLand)
		addTiles(args, player);
	else
		removeTiles(args, player);
	needRefresh = true;
}
function onLandPermissionToolDown(args){
	groupIndex = network.currentPlayer.group;

	//check for admin
	if(groupIndex != 0){
		ui.tileSelection.tiles = [];
	}
	else{
		updateTool(args, selectedPlayer);
		lastCursorPosition = args.mapCoords;
	}
	
}

minX = 0;
maxX = 0;
minY = 0;
maxY = 0;
needRefresh = true;
oldTiles = []
function updateCursorPosition(args, player)
{
	//update the cursor
	mapCoords = args.mapCoords;
	if(mapCoords.x == 0 || mapCoords.y == 0)
		return;

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
		for(i = 0; i < mapCoordsOwned[player].length; i++){
			owned = mapCoordsOwned[player][i];
			if(owned){
				coords = getCoords(i);
				oldTiles.push(coords);
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
	//get group of current player
	groupIndex = network.currentPlayer.group;

	//check for admin
	if(groupIndex != 0){
		ui.tileSelection.tiles = [];
	}
	else if(args.mapCoords.x != lastCursorPosition.x || args.mapCoords.y != lastCursorPosition.y)
	{
		updateCursorPosition(args, selectedPlayer);
		if(args.isDown){
			updateTool(args, selectedPlayer);
		}
	}
	lastCursorPosition = args.mapCoords;
}

function onPlayerJoin(args){
	//add player
	addPlayer(args.player);

	//put this player back online
	isPlayerOnline[args.player] = true;
}

function onPlayerLeave(args){
	//put this player offline
	isPlayerOnline[args.player] = false;
}

function getCoords(index){
	y = index % (map.size.y);
	x = Math.floor(index / (map.size.y));
	return {x:x << 5, y:y << 5};
}

mapSize32 = {x:map.size.x << 5, y:map.size.y << 5};
function isOwned(player,x,y){
	index = ((y % (mapSize32.y)) + (map.size.y*x)) >> 5;
	return mapCoordsOwned[player][index];
}

function setOwned(player,x,y,owned){
	index = ((y % (mapSize32.y)) + (map.size.y*x)) >> 5;
	mapCoordsOwned[player][index] = owned;
}

function initOwnedMapCoords(player){
	mapSize32 = {x:map.size.x << 5, y:map.size.y << 5};
	for(i = 0; i < mapSize32.x; i += 32){
		for(j = 0; j < mapSize32.y; j += 32){
			setOwned(player,i,j,false);
		}
	}
	lastMapSize = map.size;
}

function addPlayer(player){

	//check if player exists
	for(p = 0; p < players.length; p++){
		if(players[p] == player.id){
			return;
		}
	}

	//add the player and initialize its coordinates
	console.log("adding player #" + player.id);
	players.push(player.id);
	mapCoordsOwned[player.id] = [];

	//add the player to the drop down list
	window = ui.getWindow("land_permissions")
	dropdown = window.findWidget("player_dropdown");
	items = [];

	items.push("frutiemax");
	dropdown.items = items;
	dropdown.selectedIndex = 0;
	console.log("dropdown = " + dropdown.items);


	initOwnedMapCoords(player.id);
}

lastMapSize = 0;
function onTick(){
	if(lastMapSize.x != map.size.x || lastMapSize.y != map.size.y)
		initOwnedMapCoords(network.currentPlayer);
}

function main() {
	context.subscribe("action.query",onQuery);

	
	console.log("map initialized");
	
	if (typeof ui === 'undefined') {
        return;
    }
	setToOwnedLand = true;
	
	//ui to permit land
	ui.registerMenuItem("Land permissions editor", openLandPermissionWindow);

	//check if the map size has changed
	//context.subscribe("interval.tick", onTick);

	//subscribe to player join and leave
	context.subscribe("network.join", onPlayerJoin);
	context.subscribe("network.leave", onPlayerLeave);
	
	return;
	
}

registerPlugin({
    name: 'PlayerTerritory',
    version: '1.0',
    authors: ['Frutiemax'],
    type: 'remote',
    main: main
});

