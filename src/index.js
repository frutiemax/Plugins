
/// <reference path="C:\Users\lucas\OneDrive\Documents\openrct2-dev\OpenRCT2\distribution\openrct2.d.ts" />

import GameCommandType from './defines'
import {compressData, uncompressData} from './compression';

ownedMapCoordsInit = false;
mapCoordsOwned = [];
players = [];
isPlayerOnline = []


cursorSize = 4;
cursorMapCoords = []
lastCursorPosition = {}

function onQuery(Args){
	result = Args.result;
	if(Args.type != GameCommandType.TogglePause && Args.type != GameCommandType.LoadOrQuit){
		
		
		if(result.position != null){
			coords = Args.result.position;
			coords = {x: Math.floor(coords.x/32), y:Math.floor(coords.y/32)};
			coords = {x: coords.x * 32, y: coords.y * 32};

			tileOwned = isOwned(Args.player, coords.x, coords.y);
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
selectedPlayer = {}

function findPlayerID(playerName){
	for(i = 0; i < players.length; i++){
		if(players[i] == playerName){
			return i;
		}
	}
	return null;
}

function onDecrementPlayerSelection(){
	//get the id of the selected player
	if(network.mode == "none"){
		id = 0;
		return;
	}
	else{
		id = findPlayerID(selectedPlayer);
	}
	id = id - 1;
	if(id < 0)
		id = 0;
	
	selectedPlayer = players[id];
	
	updatePlayerSelectionText();

	//refresh the selected tiles
	oldTiles = []
	for(i = 0; i < mapCoordsOwned[id].length; i++){
		owned = mapCoordsOwned[id][i];
		if(owned){
				coords = getCoords(i);
				oldTiles.push(coords);
			}
		}
		needRefresh = false;
	ui.tileSelection.tiles = oldTiles;
}

function updatePlayerSelectionText(){
	//get the player name
	name = selectedPlayer;

	//get the spinner
	window = ui.getWindow("land_permissions");
	spinner = window.findWidget("player_selection_spinner");
	spinner.text = name;
}

function onIncrementPlayerSelection(){
	if(network.mode == "none"){
		id = 0;
		return;
	}
	else{
		id = findPlayerID(selectedPlayer);
	}
	id = id + 1;

	if(id >= players.length)
		id = players.length - 1;

	selectedPlayer = players[id];
	updatePlayerSelectionText();

	//refresh the selected tiles
	oldTiles = []
	for(i = 0; i < mapCoordsOwned[id].length; i++){
		owned = mapCoordsOwned[id][i];
		if(owned){
				coords = getCoords(i);
				oldTiles.push(coords);
			}
		}
		needRefresh = false;
	ui.tileSelection.tiles = oldTiles;
}

function onToolUp(args){
	index = findPlayerID(selectedPlayer);
	context.executeAction("modify_land_restrictions", {player : index, playerOwnedTiles : compressData(mapCoordsOwned[index])});
}
function openLandPermissionWindow(){
	
	for(i = 0; i < network.numPlayers; i++){
		addPlayer(network.getPlayer(i).name);
	}
	context.executeAction("request_land_restrictions", {name:"request_land_restrictions"});

	landButton = {
		type: "button",
		x : 110,
		y: 60,
		width : 50,
		height : 12,
		name: "land_editor_toggle",
		onClick: onLandButtonToggleClick,
		text : "Land"
	};

	cursorSizeWidget = {
		type: "spinner",
		x : 10,
		y: 60,
		width : 100,
		height : 12,
		name: "cursor_size_spinner",
		text : "1x1",
		onDecrement: onDecrementCursorSize,
        onIncrement: onIncrementCursorSize
	}

	playerSelectionSpinner = {
		type: "spinner",
		x : 10,
		y: 48,
		width : 150,
		height : 12,
		name: "player_selection_spinner",
		text : "",
		onDecrement: onDecrementPlayerSelection,
        onIncrement: onIncrementPlayerSelection
	}

	/*playerDropDown = {
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
	}*/
	
	landEditor = ui.openWindow({
		classification: "land_permissions",
		x: 500,
		y: 500,
		width: 170,
		height: 100,
		title:"Land Permissions Editor",
		minWidth: 100,
		minHeight: 50,
		widgets: [landButton,cursorSizeWidget, playerSelectionSpinner],
		colours: [200],
		isSticky: true,
		
		onClose: onLandPermissionWindowClose
	});
	
	landPermissionToolDesc = {
		id : "land_permissions_tool",
		cursor : "fence_down",
		onDown : onLandPermissionToolDown,
		onMove : onLandPermissionToolMove,
		onUp : onToolUp
	};
	
	//show tool
	ui.activateTool(landPermissionToolDesc);
	updateCursorSizeText();
	selectedPlayer = findPlayerByName(network.currentPlayer.name);
	updatePlayerSelectionText();
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
	group = network.currentPlayer.group;
	if(group != 0){
		return;
	}
	else if(setToOwnedLand)
		addTiles(args, player);
	else
		removeTiles(args, player);
	needRefresh = true;
}
function onLandPermissionToolDown(args){
	index = findPlayerID(selectedPlayer);
	updateTool(args, index);
	lastCursorPosition = args.mapCoords;
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

	if(args.mapCoords.x != lastCursorPosition.x || args.mapCoords.y != lastCursorPosition.y)
	{
		index = findPlayerID(selectedPlayer);
		updateCursorPosition(args, index);
		if(args.isDown){
			updateTool(args, index);
		}
	}
	lastCursorPosition = args.mapCoords;
}

function onPlayerJoin(args){
	//add player
	player = network.getPlayer(args.player);
	addPlayer(player.name);
	for(i = 0; i < players.length; i++)
	{
		context.executeAction("modify_land_restrictions", {player : i, playerOwnedTiles : compressData(mapCoordsOwned[i])});
	}
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

function addPlayer(playerName){

	//check if player exists
	for(p = 0; p < players.length; p++){
		if(players[p] == playerName){
			console.log("not adding player.name " + playerName);
			return;
		}
	}

	//add the player and initialize its coordinates
	console.log("adding player.name " + playerName);
	players.push(playerName);
	index = findPlayerID(playerName);

	mapCoordsOwned[index] = [];
	initOwnedMapCoords(index);
}

lastMapSize = 0;
counter = 0;
function onTick(){
	/*if(lastMapSize.x != map.size.x || lastMapSize.y != map.size.y)
		initOwnedMapCoords(network.currentPlayer);*/
}

function onLandRestrictionsModify(args){
	mapCoordsOwned[args.player] = uncompressData(args.playerOwnedTiles);
	needRefresh = true;
	return {
		error : 0,
		errorTitle : "",
		errorMessage : ""
	};
}

function onPlayersModify(args){
	for(i = 0; i < args.players.length; i++){
		addPlayer(args.players[i]);
	}
	return {
		error : 0,
		errorTitle : "",
		errorMessage : ""
	};
}

function onActionExecute(args){
	if(args.args.name == "request_land_restrictions"){
		console.log("onRequestLandPermissions");
		console.log("players.length = " + players.length);
		for(i = 0; i < players.length; i++)
		{
			context.executeAction("modify_land_restrictions", {player : i, playerOwnedTiles : compressData(mapCoordsOwned[i])});
		}
	}
	else if(args.args.name == "request_players"){
		//add the players
		context.executeAction("modify_players", {players : players});
	}
}
function onLandRestrictionsRequest(args){
	return {
		error : 0,
		errorTitle : "",
		errorMessage : ""
	};
}

function onPlayersRequest(args){
	//initialize players maps
	return {
		error : 0,
		errorTitle : "",
		errorMessage : ""
	};
}

function findPlayerByName(name){
	for(i = 0; i < players.length; i++){
		if(players[i] == name)
			return players[i];
	}
	return null;
}

function main() {
	firstRun = true;
	counter = 0;
	context.subscribe("action.query",onQuery);
	setToOwnedLand = true;
	
	//ui to permit land
	if (typeof ui !== 'undefined') {
		ui.registerMenuItem("Land permissions editor", openLandPermissionWindow);
	}

	if(network.mode == "server" || network.mode == "none"){
			//subscribe to player join and leave
		context.subscribe("action.execute", onActionExecute);
		addPlayer(network.currentPlayer.name);
		selectedPlayer = findPlayerByName(network.currentPlayer.name);
	}
	context.subscribe("network.join", onPlayerJoin);
	context.subscribe("network.leave", onPlayerLeave);

	context.subscribe("interval.tick", onTick);

	//register custom game action for sending tiles on tool release
	context.registerAction("modify_land_restrictions", 
	function(args){return {
		error : 0,
		errorTitle : "",
		errorMessage : ""
	};}, 
	function(args){return onLandRestrictionsModify(args);});

	//register custom game action for setting the players list
	context.registerAction("modify_players", 
	function(args){return {
		error : 0,
		errorTitle : "",
		errorMessage : ""
	};}, 
	function(args){return onPlayersModify(args);});

	//register custom game action for getting tiles on game start
	context.registerAction("request_land_restrictions", 
	function(args){return {
		error : 0,
		errorTitle : "",
		errorMessage : ""
	};}, 
	function(args){return onLandRestrictionsRequest(args);});

	//register custom game action for getting the players with land permissions
	context.registerAction("request_players", 
	function(args){return {
		error : 0,
		errorTitle : "",
		errorMessage : ""
	};}, 
	function(args){return onPlayersRequest(args);});

	//request the tiles and list of players
	if(network.mode == "client"){
		//request the list of players
		context.executeAction("request_players", {name:"request_players"});

		//request the tiles
		context.executeAction("request_land_restrictions", {name:"request_land_restrictions"});

		//get the selected player on client side
		selectedPlayer = players[0];
	}

	//testing the compression algorithm
	data = [false, false, false, false, true, true, false, false, false];
	test = compressData(data);
	console.log("compressed = " + test);

	test2 = uncompressData(test);
	console.log("uncompressed = " + test2);

	return;
}

registerPlugin({
    name: 'PlayerTerritory',
    version: '1.0',
    authors: ['Frutiemax'],
    type: 'remote',
    main: main
});

