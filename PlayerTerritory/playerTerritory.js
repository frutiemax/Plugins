
ownedTiles = []
ownedMapCoords = []
var GameCommandType =
{
	SetRideAppearance 			: 0,
	SetLandHeight 				: 1,
	TogglePause 				: 2,
	PlaceTrack 					: 3,
	RemoveTrack 				: 4,
	LoadOrQuit					: 5,
	CreateRide					: 6,
	DemolishRide				: 7,
	SetRideStatus				: 8,
	SetRideVehicules			: 9,
	SetRideName					: 10,
	SetRideSettings				: 11,
	PlaceRideEntranceOrExit 	: 12,
	RemoveRideEntranceOrExit 	: 13,
	RemoveScenery				: 14,
	PlaceScenery				: 15,
	SetWaterHeight				: 16,
	PlacePath					: 17,
	PlacePathFromTrack			: 18,
	RemovePath					: 19,
	ChangeSurfaceStyle			: 20,
	SetRidePrice				: 21,
	SetGuestName				: 22,
	SetStaffName				: 23,
	RaiseLand					: 24,
	LowerLand					: 25,
	EditLandSmooth				: 26,
	RaiseWater					: 27,
	LowerWater					: 28
	
};

function isTileOwned(coords){
	found = false;
	index = 0;
	
	for(index = 0; index < ownedTiles.length; index++){
		if(ownedTiles[index].x == coords.x && 
			ownedTiles[index].y == coords.y){
			found = true;
			break;
		}
	}
	return {found, index};
}

function onQuery(Args){
	if(Args.type != GameCommandType.TogglePause || Args.type != GameCommandType.LoadOrQuit){
		result = Args.result;
		
		console.log("action query");
		
		if(result.position != null){
			tileCoords = {	x:Math.floor(result.position.x/32),
						y:Math.floor(result.position.y/32)};
			tileOwned = isTileOwned(tileCoords);
			console.log(result.position);
			
			if(tileOwned.found == false)
			{
				console.log("not in territory");
				result.error = 1;
				result.errorTitle = "Construction is not allowed outside of holy land";
			}
		}
		
	}
}

setToOwnedLand = true;
function onLandButtonToggleClick(){
	console.log("button click");
	console.log(setToOwnedLand);
	if(setToOwnedLand == false)
	{
		setToOwnedLand = true;
	}
	else
	{
		setToOwnedLand = false;
	}
}

function onLandPermissionWindowClose(){
	ui.tool.cancel();
}

function openLandPermissionWindow(){
	
	landButton = {
		type: "button",
		x : 250,
		y: 250,
		width : 100,
		height : 28,
		name: "land_editor_toggle",
		onClick: onLandButtonToggleClick,
		text : "LandButton"
	};
	
	landEditor = ui.openWindow({
		classification: "land_permissions",
		x: 500,
		y: 500,
		width: 100,
		height: 100,
		title:"Land Permissions Editor",
		minWidth: 400,
		minHeight: 400,
		widgets: [landButton],
		colours: [200],
		isSticky: false,
		
		onClose: onLandPermissionWindowClose
	});
	
	landPermissionToolDesc = {
		id : "land_permissions_tool",
		cursor : "fence_down",
		onDown : onLandPermissionToolDown
	};
	
	//show tool
	ui.activateTool(landPermissionToolDesc);
	
	//show owned tiles
	ui.tileSelection.tiles = ownedTiles;
}


function updateTool(args)
{
	//find if the coords is in the owned tiles
	coords = args.mapCoords;
	tileCoords = {x:Math.floor(coords.x/32),y:Math.floor(coords.y/32)};
	console.log("tileCoords.x = " + tileCoords.x + "  tileCoords.y=" + tileCoords.y);
	//find if the coordinate exists
	tileOwned = isTileOwned(tileCoords);
	
	console.log("tileOwned=" + tileOwned);
	if(setToOwnedLand == true){
		//add element to owned tiles only if it doesn't exist
		if(tileOwned.found == false)
		{
			console.log("adding tile");
			
			
			ownedTiles.push(tileCoords);
			ownedMapCoords.push(coords);
			
			//update the tile selection
			ui.tileSelection.tiles = ownedMapCoords;
		}
	}
	else{
		//remove element from list
		if(tileOwned.found == true)
		{
			console.log("removing tile");
			ownedTiles.splice(tileOwned.index,1);
			ownedMapCoords.splice(tileOwned.index,1);
			
			//update the tile selection
			ui.tileSelection.tiles = ownedMapCoords;
		}
	}
}
function onLandPermissionToolDown(args){
	
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

