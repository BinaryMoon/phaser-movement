"use strict";


var Game = {

	// Game Properties.
	name: 'Phaser Movement',
	debug: false,
	background_color: '#3f2832',
	desiredFps: false,

	// Code collections.
	States: {},
	Prefabs: {},
	Utils: {},

};

// Plugins.

// Utils.
Game.Utils.Controls = {

	cursor: null,
	action: null,

	init: function() {

		// Controls
		this.cursor = game.input.keyboard.createCursorKeys();
		this.action = game.input.keyboard.addKey( Phaser.Keyboard.SPACEBAR );

	},

};

Game.Utils.Layers = {

	layers: {},

	init: function() {

		// Generate layers.
		this.layers = {
			groupLevelBottom: game.add.group(),
			groupElements: game.add.group(),
		};

		// Return layers.
		return this.layers;

	},

};


/**
 * Map object
 * Load and setup tilemaps.
 * Includes all collision and interaction info.
 */
Game.Utils.Map = {

	// VARIABLES
	player_position: {},

	// Loaded map.
	map: null,

	// Layers.
	layer: null,
	layer_details: null,


	// Tile dimensions.
	TILE_SIZE: 8,
	TILE_HALF_SIZE: 4,


	load_world: function( map_name, layers, params ) {

		params.texture = 'tiles';

		this.load( map_name, layers, params );

	},


	load: function( map_name, layers, params ) {

		// setup map
		this.map = game.add.tilemap( map_name );

		this.map.addTilesetImage( params.texture );

		this.map.setCollisionBetween( 1, 32 );

		// Add map layers.
		this.layer = this.map.createLayer( 'tiles' );
		layers.groupLevelBottom.add( this.layer );

		this.layer.resizeWorld();

		// Additional details drawn on top of the map to make things look more interesting
		this.layer_details = this.map.createLayer( 'details' );
		layers.groupLevelBottom.add( this.layer_details );

		// position player
		var player_position = this.find_objects_by_type( 'start', this.map, 'objects' );

		// use the first result - there should only be 1 start point per level
		// if there isn't we'll just ignore the others
		this.player_position.x = parseInt( player_position[0].x + this.TILE_HALF_SIZE );
		this.player_position.y = parseInt( player_position[0].y );

	},


	/**
	 * Find objects in a Tiled layer that have the type equal to a certain value.
	 *
	 * @param   {String}     type   The object type to find, as specified in the map file
	 * @param   {Object}     map    Tilemap bject
	 * @param   {String}     layer  Key for object layer to search
	 * @returns {Array}      List of objects
	 */
	find_objects_by_type: function( type, map, layer ) {

		var result = new Array();

		map.objects[layer].forEach(

			function( element ) {

				if ( '' !== type ) {

					if ( typeof element.type !== 'undefined' && element.type.toLowerCase() === type.toLowerCase() ) {

						result.push( element );

					}

				} else {

					result.push( element );

				}

			}

		);

		return result;

	},


	/**
	 * Generate a cache slug for the current level.
	 *
	 * @param  {[type]} path [description]
	 * @return {[type]}      [description]
	 */
	map_slug: function( path ) {

		var slug = path;

		slug = slug.replace( /\//g, '-' );
		slug = slug.toLowerCase();
		slug = slug.replace( '.json', '' );

		return slug;

	},

};

/**
 * Create a smooth transition between two values.
 *
 * @param  {Number} current        Current value.
 * @param  {Number} target         Target value.
 * @param  {Number} [smoothing=10] Smoothing amount. A larger number = more iterations to complete the transition.
 * @return {Number}
 */
Math.smooth = function( current, target, smoothing = 10 ) {

	var step = ( target - current ) / smoothing;

	// Step is small so let's finish the transition and reach the target.
	if ( Math.abs( step ) < 0.01 ) {
		return target;
	}

	return current + step;

}

Game.Utils.PlayerAnimation = {

	do: function( player ) {

		if ( ! player.alive ) {
			return;
		}

		player.animation = 'walk-down';

		var speed = 10;

		if ( player.body.velocity.y > speed ) {
			player.animation = 'walk-down';
		}

		if ( player.body.velocity.y < -speed ) {
			player.animation = 'walk-up';
		}

		if ( player.body.velocity.x > speed ) {
			player.animation = 'walk-right';
		}

		if ( player.body.velocity.x < -speed ) {
			player.animation = 'walk-left';
		}

		player.animations.play( player.animation );

	},

};

Game.Utils.PlayerPhysics = {

	do: function( player ) {

		if ( ! player.alive ) {
			return;
		}

		var speed = 4;

		if ( player.controls.down ) {

			player.body.velocity.y += speed;

		} else if ( player.controls.up ) {

			player.body.velocity.y -= speed;

		}

		if ( player.controls.left ) {

			player.body.velocity.x -= speed;

		} else if ( player.controls.right ) {

			player.body.velocity.x += speed;

		}

	},

};


// Prefabs
/**
 * Player object
 * Controls all skiers, their physics, and their properties.
 */
Game.Prefabs.Player = function( game, x, y, group ) {

	// Setup Player.
	//
	// This uses a null display object. This allows me to apply physics to
	// the skier independently of the character display image. I can then
	// snap the character display image to whole pixels - which keeps
	// things looking nice and crisp whilst having accurate physics.
	Phaser.Sprite.call( this, game, x, y, 'player' );

	// Setup Player Physics.
	game.physics.enable( this, Phaser.Physics.ARCADE );

	// No gravity - it's a top down game and the game physics take care of downward motion.
	this.gravity = 0;

	// Increase tile padding to ensure the character does not pass through tiles by mistake.
	this.body.tilePadding.set( 12, 12 );

	// Not allowed to travel outside world bounds.
	this.body.collideWorldBounds = true;

	this.body.setSize( 8, 8, 2, 5 );

	// Player display image.
	this.anchor.setTo( 0.5, 1 );

	// animations.
	this.animations.add( 'walk-right', [ 7, 8, 7, 9 ], 4, true );
	this.animations.add( 'walk-left', [ 11, 12, 11, 13 ], 4, true );
	this.animations.add( 'walk-down', [ 0, 1, 0, 2 ], 4, true );
	this.animations.add( 'walk-up', [ 3, 4, 3, 5 ], 4, true );

	// Add Player.
	group.add( this );


	// Currently playing animation.
	this.animation = '';

	// Initialize the controls.
	this.controls = [];

	// Make sure the player is enabled.
	this.alive = true;
	this.body.enable = true;

};

Game.Prefabs.Player.prototype = Object.create( Phaser.Sprite.prototype );

Game.Prefabs.Player.constructor = Game.Prefabs.Player;


/**
 * Move player
 */
Game.Prefabs.Player.prototype.controller = function() {

	// Controls.
	this.controls.up = Game.Utils.Controls.cursor.up.isDown;
	this.controls.down = Game.Utils.Controls.cursor.down.isDown;
	this.controls.left = Game.Utils.Controls.cursor.left.isDown;
	this.controls.right = Game.Utils.Controls.cursor.right.isDown;
	this.controls.action = Game.Utils.Controls.action.isDown;

};


/**
 * Update Player Positions.
 */
Game.Prefabs.Player.prototype.update = function() {

	// Update movement and physics.
	this.controller();

	game.physics.arcade.collide( this, Game.Utils.Map.layer );

	if ( this.alive ) {

		Game.Utils.PlayerPhysics.do( this );

	}

	Game.Utils.PlayerAnimation.do( this );

	// Update Player physics.
	this.do_physics();

	Phaser.Sprite.prototype.update.call( this );

};


/**
 * Update player physics properties.
 * Takes care of friction, and jumping off of things.
 */
Game.Prefabs.Player.prototype.do_physics = function() {

	// Quit if not currently active.
	if ( ! this.alive ) {
		return;
	}

	// Use a reasonably high friction value to allow for a bit of momentum.
	// Closer to 1 = more sliding.
	var friction = 0.925;

	// update velocities.
	this.body.velocity.x = this.body.velocity.x * friction;
	this.body.velocity.y = this.body.velocity.y * friction;

};


// States.
/* global game, Phaser, social */

Game.States.Boot = function( game ) {

}

Game.States.Boot.prototype = {

	preload: function () {

		game.load.image( 'progressBar', 'assets-game/images/loading.png' );

		// Align game to the center of the available space.
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;

		// Make game stretch to fill screen fully
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

		// Make game nice and crisp (as crispy as can be).
		game.renderer.renderSession.roundPixels = true;
		Phaser.Canvas.setImageRenderingCrisp( game.canvas );
		game.stage.smoothed = false;
		game.camera.roundPx = true;

		// update game scale.
		game.scale.refresh();

		// Set a background color.
		game.stage.backgroundColor = Game.background_color;

		// Setup arcade physics.
		game.physics.startSystem( Phaser.Physics.ARCADE );
		game.physics.arcade.TILE_BIAS = 8;

		if ( Game.desiredFps ) {
			game.time.desiredFps = Game.desiredFps;
		}

	},

	create: function() {

		// switch to the loading state
		game.state.start( 'load' );

	}

};


Game.States.Load = {

	init: function () {

		this.input.maxPointers = 1;

		this.scale.pageAlignHorizontally = true;

	},

	preload: function () {

		// Add a progress bar
		var progressBar = game.add.sprite( game.width / 2, game.height / 2, 'progressBar' );
		progressBar.anchor.setTo( 0.5, 0.5 );
		game.load.setPreloadSprite( progressBar );

		this.load.path = 'assets-game/';


		// Images
		game.load.image( 'tiles', 'images/tiles.png' );


		// Sprites
		game.load.spritesheet( 'player', 'images/player.png', 12, 15 );


		// Physics
		Phaser.Physics.Arcade.sortDirection = Phaser.Physics.Arcade.TOP_BOTTOM;


	},

	create: function() {

		Game.Utils.Controls.init();

		window.focus();

		game.state.start(
			'load-world',
			true,
			false,
			{
				type: 'world',
				path: 'map'
			}
		);

	},

};

/**
 * Load a map and then display it.
 *
 * @type {Object}
 */
Game.States.LoadWorld = {

	params: null,

	init: function ( params ) {

		if ( params ) {
			this.params = params;
			this.params.slug = Game.Utils.Map.map_slug( this.params.path );
		}

	},

	preload: function () {

		// Add a progress bar
		var progressBar = game.add.sprite( game.world.centerX, game.world.centerY, 'progressBar' );
		progressBar.anchor.setTo( 0.5, 0.5 );
		game.load.setPreloadSprite( progressBar );

		this.load.path = 'assets-game/';

		// Check if the file has already been loaded so we don't load it again.
		if ( ! game.cache.checkTilemapKey( this.params.slug ) ) {

			console.log( 'load map:', this.params.slug );

			game.load.tilemap( this.params.slug, 'levels/' + this.params.path + '.json', null, Phaser.Tilemap.TILED_JSON );

		}

	},

	create: function() {

		game.state.start( 'world', true, false, this.params );

	},

};

/**
 * Overworld
 *
 * @type {Object}
 */
Game.States.World = {

	player: null,

	params: null,


	/**
	 * Initialize the state.
	 *
	 * @param  {Object} params A json object storing the level parameters.
	 * @return {[type]}        [description]
	 */
	init: function ( params ) {

		if ( params ) {

			this.params = params;

		}

	},


	/**
	 * Create game world
	 */
	create: function () {

		// Create drawing layers.
		this.layers = Game.Utils.Layers.init();

		// Create player
		this.player = new Game.Prefabs.Player( game, 0, 0, this.layers.groupElements );

		Game.Utils.Map.load_world( this.params.slug, this.layers, this.params );

		this.player.x = Game.Utils.Map.player_position.x;
		this.player.y = Game.Utils.Map.player_position.y;

		game.camera.follow( this.player );

	},

};


// Extensions
/**
 * Create a smooth transition between two values.
 *
 * @param  {Number} current        Current value.
 * @param  {Number} target         Target value.
 * @param  {Number} [smoothing=10] Smoothing amount. A larger number = more iterations to complete the transition.
 * @return {Number}
 */
Math.smooth = function( current, target, smoothing = 10 ) {

	var step = ( target - current ) / smoothing;

	// Step is small so let's finish the transition and reach the target.
	if ( Math.abs( step ) < 0.01 ) {
		return target;
	}

	return current + step;

}


// Boot.

var game_size = get_game_size();
var game = new Phaser.Game( game_size.width, game_size.height, Phaser.CANVAS, '', null, false, false );

// Define states
game.state.add( 'boot', Game.States.Boot );
game.state.add( 'load', Game.States.Load );
game.state.add( 'load-world', Game.States.LoadWorld );
game.state.add( 'world', Game.States.World );

// Start the "boot" state
game.state.start( 'boot' );

