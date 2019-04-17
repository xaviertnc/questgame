var app = {

  config: {

    debug: false,

    initialPage: 'gridpage',

    worldSectorColCount: 12,

    worldSectorRowCount: 12,

    states: {

      'gridpage': {
        model: function () { return app.objects.world; }
      },

      'townpage': {
        model: function () { return app.objects.world.home.town; }
      }
    }

  },

  state: {
    currentPage: null,
    pageModel: null
  },

  classes: {},

  objects: {},

  viewComponents: {},

  nextId: 0

};


if (app.config.debug && window.console)
{
  app.debug = window.console;
}
else
{
  app.debug = {
    log: function () {},
    dir: function () {},
    error: function (errMsg) { return new Error(errMsg); }
  };
}


Vue.config.debug = app.config.debug;

document.onkeydown = function(event) { return app.onKeyDown(event); };
document.onkeyup = function(event) { return app.onKeyUp(event); };


// CLASS GridPosition
app.classes.GridPosition = class GridPosition {

  constructor(col, row) {
    this.col = col;
    this.row = row;
  }

  is(other) {
    return (this.col === other.col && this.row === other.row);
  }

  matches(col, row) {
    if ( ! row && typeof col === 'object')
    {
      return this.is(col);
    }

    return (this.col === col && this.row === row);
  }

} // end: CLASS GridPosition


// CLASS Player
app.classes.Player = class Player {

  constructor(sector) {
    this.name = lib.pickRandomItem(app.data.questGrammar.characterName);
    this.icon = [{ type: 'player-icon', src:this.getIcon() }];
    this.images = this.getImages();
    this.addToSector(sector);
    this.xp = 0;
    this.level = 1;
    this.credits = 0;
    this.items = [];
    this.quests = [];
  }

  getIcon() {
    return (lib.randomNumber(100) > 50) ? 'img/player.png' : 'img/player2.png';
  };

  getRandomImage(prefix, type, maxImages) {
    var overlayImage, name;

    overlayImage = {
      src: prefix + type + '/' + type + '_' + lib.lpad(lib.randomNumber(maxImages, 1), 2) + '.png',
      type: type
    };

    return overlayImage;
  }

  getRandomNpcImage(type, maxImages) {
    return this.getRandomImage('img/NPCs/', type, maxImages);
  }

  getImages() {
    return [
      this.getRandomNpcImage('busts'    , 11),
      this.getRandomNpcImage('eyes'     , 11),
      this.getRandomNpcImage('mouths'   ,  6),
      this.getRandomNpcImage('hair'     ,  6),
      this.getRandomNpcImage('clothes'  , 11)
    ];
  }

  changeSector(direction) {
    var sector, newSector, newRow, newCol,
      GridPosition = app.classes.GridPosition,
      world = app.objects.world;

    //app.debug.log('Player::changeSector(), direction:', direction);

    sector = world.sectors[this.sectorid];

    switch (direction)
    {
      case 'up':
        newRow = this.row > 0 ? this.row - 1 : 0;
        if (newRow !== this.row) { newSector = world.getSector(new GridPosition(this.col, newRow)); }
        break;

      case 'down':
        newRow = this.row < (world.sectorRowCount - 1) ? this.row + 1 : this.row;
        if (newRow !== this.row) { newSector = world.getSector(new GridPosition(this.col, newRow)); }
        break;

      case 'left':
        newCol = this.col > 0 ? this.col - 1 : 0;
        if (newCol !== this.col) { newSector = world.getSector(new GridPosition(newCol, this.row)); }
        break;

      case 'right':
        newCol = this.col < (world.sectorColCount - 1) ? this.col + 1 : this.col;
        if (newCol !== this.col) { newSector = world.getSector(new GridPosition(newCol, this.row)); }
        break;
    }

    //app.debug.log('Player::changeSector(), newSector:', newSector);

    if (newSector)
    {
      sector.hasPlayer = false;
      this.addToSector(newSector);
    }
  }

  addToSector(sector) {
    this.sectorid = sector.id;
    this.col = sector.col;
    this.row = sector.row;
    sector.hasPlayer = true;
  }

} // end: CLASS Player


// CLASS Town
app.classes.Town = class Town {

  constructor(id, name, state) {
    this.id = id;
    this.name = name;
    state = state || {};
    this.sectorid = null;
    this.barman = {};
    this.barman.images = this.getBarmanImages();
    this.npcs = [];
    this.npcs.push({ images: this.getNpcImages() });
    this.areas = state.areas || this.getAreas();
    this.images = this.getTownImages();
    this.quests = [];
  }

  getRandomImage(prefix, type, maxImages) {
    var overlayImage, name;

    overlayImage = {
      src: prefix + type + '/' + type + '_' + lib.lpad(lib.randomNumber(maxImages, 1), 2) + '.png',
      type: type
    };

    return overlayImage;
  }

  getRandomTownImage(type, maxImages) {
    return this.getRandomImage('img/TownArea/', type, maxImages);
  }

  getRandomBarmanImage(type, maxImages) {
    return this.getRandomImage('img/Barman/', type, maxImages);
  }

  getRandomNpcImage(type, maxImages) {
    return this.getRandomImage('img/NPCs/', type, maxImages);
  }

  getTownImages() {
    return [
      this.getRandomTownImage('atmosphere', 21),
      this.getRandomTownImage('terrain'   , 16),
      this.getRandomTownImage('buildings' , 13),
      this.getRandomTownImage('misc'      , 21)
    ];
  }

  getNpcImages() {
    return [
      this.getRandomNpcImage('busts'  , 11),
      this.getRandomNpcImage('eyes'   , 11),
      this.getRandomNpcImage('mouths' , 6 ),
      this.getRandomNpcImage('hair'   , 6 ),
      this.getRandomNpcImage('clothes', 11)
    ];
  }

  getBarmanImages() {
    return [
      this.getRandomBarmanImage('cloths' , 2 ),
      this.getRandomBarmanImage('busts'  , 11),
      this.getRandomBarmanImage('eyes'   , 11),
      this.getRandomBarmanImage('mouths' , 6 ),
      this.getRandomBarmanImage('hair'   , 6 ),
      this.getRandomBarmanImage('misc'   , 2 ),
      this.getRandomBarmanImage('clothes', 11)
    ];
  }

  getAreas() {
    return lib.excludeRandomItems(
      app.data.townAreaTypes,
      5,
      function (item) { return item.id === 'townmain' || item.id === 'questboard' || item.id === 'tavern'; }
    );
  }

  addQuests(world) {
    var i, n = lib.randomNumber(4, 1), quest, questSector;
    for (i = 0; i < n; i++)
    {
      quest = new app.classes.Quest(
        'q' + app.nextId++,
        lib.pickRandomItem(Object.keys(app.data.questTypes)),
        app.pickRandomGridPosition(app.config.worldSectorColCount, app.config.worldSectorRowCount)
      );
      quest.addToSector(world.getSector(quest.location));
      this.quests.push(quest);
    }
  }

  addToSector(sector) {
    var i, n;
    sector.type = 'town';
    sector.items.push(this);
    sector.placeid = this.id;
    this.sectorid = sector.id;
  }

} // end: CLASS Town


// CLASS QuestReward
app.classes.QuestReward = class QuestReward {

  constructor(xp, credits, items) {
    this.xp = xp;
    this.credits = credits;
    this.items = items || [];
  }

} // end: CLASS QuestReward


// CLASS Quest
app.classes.Quest = class Quest {

  constructor(id, type, location)
  {
    this.id = id;
    this.type = type;
    this.location = location;
    this.description = this.getDescription(this.type);
    this.reward = this.getReward(this.type);
    this.conditions = this.getConditions(this.type);
    this.status = 'unassigned';
    this.sectorid = null;
  }

  getDescription(questType) {
    var questTypeTemplates, questTemplate, questDescription;
    //app.debug.log('Quest::getDescription(), questType:', questType);

    questTypeTemplates = app.data.questTypes[questType];
    //app.debug.log('Quest::getDescription(), questTypeTemplates:', questTypeTemplates);

    questTemplate = lib.pickRandomItem(questTypeTemplates);
    //app.debug.log('Quest::getDescription(), questTemplate:', questTemplate);

    questDescription = app.questGrammar.flatten(questTemplate);
    //app.debug.log('Quest::getDescription(), questDescription:', questDescription);

    return questDescription;
  }

  getReward(questType) {
    var reward, weights = {};

    switch (questType)
    {
      case 'steal':
        weights.item = 0.8;
        weights.credits = 100;
        weights.xp = 450;
        break;
      case 'gathering':
        weights.item = 0.3;
        weights.credits = 350;
        weights.xp = 450;
        break;
      case 'kill':
        weights.item = 0;
        weights.credits = 700;
        weights.xp = 650;
        break;
      case 'bounty':
        weights.item = 0;
        weights.credits = 850;
        weights.xp = 500;
        break;
      case 'explore':
        weights.item = 0.5;
        weights.credits = 350;
        weights.xp = 400;
        break;
      case 'diplomatic':
        weights.item = 0.1;
        weights.credits = 150;
        weights.xp = 600;
        break;
      default:
        weights.item = 0.3;
        weights.credits = 100;
        weights.xp = 250;
    }

    reward = new app.classes.QuestReward(
      weights.xp + lib.randomNumber(weights.xp * 0.5)|0,
      weights.credits + lib.randomNumber(weights.credits * 0.5)|0,
      (Math.random() <= weights.item) ? lib.pickRandomItems(
        app.data.questGrammar.item,
        (app.data.questGrammar.item.length * weights.item)|0
      ) : []
    );

    return reward;
  }

  getConditions(questType) {
    var conditions = lib.pickRandomItems(app.data.questGrammar.requirements, 2);
    return conditions.length ? conditions : ["*open to all"];
  }

  addToSector(sector) {
    this.sectorid = sector.id;
    sector.quests.push(this);
    sector.hasQuest = true;
  }

} // end: CLASS Quest


// CLASS Sector
app.classes.Sector = class Sector {

  constructor(id, gridPosition) {
    this.id = id;
    this.col = gridPosition.col;
    this.row = gridPosition.row;
    this.hasPlayer = false;
    this.placeid = null;
    this.type = null;
    this.items = [];
    this.quests = [];
  }

} // end: CLASS Sector


// CLASS World
app.classes.World = class Word {

  constructor(sectorColCount, sectorRowCount) {
    this.name = 'world';
    this.sectorColCount = sectorColCount;
    this.sectorRowCount = sectorRowCount;
    this.player = {};
    this.sectors = [];
    this.places = [];
    this.home = {};

    this.generate();
  }

  getSectors() {
    return this.sectors;
  }

  getSectorsInRow(row) {
    //app.debug.log('World::getSectorsInRow(), row:', row);

    var offset = row * this.sectorColCount,
      sectorsInRow = [],
      i, n;

    for (i = offset, n = offset + this.sectorColCount; i < n; i++)
    {
      sectorsInRow.push(this.sectors[i]);
    }

    return sectorsInRow;
  }

  getSectorIndex(gridPosition) {
    return gridPosition.row * this.sectorColCount + gridPosition.col;
  }

  getSector(gridPosition) {
    return this.sectors[this.getSectorIndex(gridPosition)];
  }

  // Add World Sectors
  addSectors() {
    var sector,
      sectorRow,
      sectorColumn,
      sectorGridPosition,
      GridPosition = app.classes.GridPosition,
      Sector = app.classes.Sector,
      sectors = [];

    app.debug.log('World::addSectors(), cols:', this.sectorColCount, ', rows:', this.sectorRowCount);

    for (sectorRow = 0; sectorRow < this.sectorRowCount; sectorRow++) {
      for (sectorColumn = 0; sectorColumn < this.sectorColCount; sectorColumn++) {
        sectorGridPosition = new GridPosition(sectorColumn, sectorRow);
        sector = new Sector(this.getSectorIndex(sectorGridPosition), sectorGridPosition);
        sectors.push(sector);
      }
    }

    return sectors;
  }

  // Add World Places
  addPlaces() {
    var randomSector, town, n;
    //app.debug.log('World::addPlaces()');
    randomSector = lib.pickRandomItem(this.sectors);
    town = new app.classes.Town(this.places.length, 'Home Town');
    town.addToSector(randomSector);
    town.addQuests(this);
    this.home.sector = randomSector;
    this.home.town = town;
    this.places.push(town);
    n = 0;
    do { randomSector = lib.pickRandomItem(this.sectors); n++; }
    while (randomSector.type && n < 3);
    town = new app.classes.Town(this.places.length, lib.pickRandomItem(app.data.questGrammar.location));
    town.addToSector(randomSector);
    town.addQuests(this);
    this.places.push(town);
    n = 0;
    do { randomSector = lib.pickRandomItem(this.sectors); n++; }
    while (randomSector.type && n < 3);
    town = new app.classes.Town(this.places.length, lib.pickRandomItem(app.data.questGrammar.location));
    town.addToSector(randomSector);
    town.addQuests(this);
    this.places.push(town);
    n = 0;
    do { randomSector = lib.pickRandomItem(this.sectors); n++; }
    while (randomSector.type && n < 3);
    town = new app.classes.Town(this.places.length, lib.pickRandomItem(app.data.questGrammar.location));
    town.addToSector(randomSector);
    town.addQuests(this);
    this.places.push(town);
    n = 0;
    do { randomSector = lib.pickRandomItem(this.sectors); n++; }
    while (randomSector.type && n < 3);
    town = new app.classes.Town(this.places.length, lib.pickRandomItem(app.data.questGrammar.location));
    town.addToSector(randomSector);
    town.addQuests(this);
    this.places.push(town);
    app.debug.log('World::addPlaces(), home sector:', this.home.sector);
    app.debug.log('World::addPlaces(), home town:', this.home.town);
    app.debug.log('World::addPlaces(), places:', this.places);
  }

  // Add Player
  addPlayer() {
    var randomSector, player, n = 0;
    //app.debug.log('World::addPlayer()');
    do { randomSector = lib.pickRandomItem(this.sectors); n++; }
    while (randomSector.id === this.home.sector.id && n < 3);
    player = new app.classes.Player(randomSector);
    this.player = player;
    app.debug.log('World::addPlayer(), player sector:', randomSector);
    app.debug.log('World::addPlayer(), player:', this.player);
  }

  // Generate World
  generate() {
    app.debug.log('World::generate()');
    this.sectors = this.addSectors();
    this.addPlaces();
    this.addPlayer();
  }

} // end CLASS: World


// MULTI-LAYER IMAGE

app.viewComponents.MultiLayerImage = function (template)
{
  this.template = template;
  this.props = ['id', 'images'];

  this.methods = {

    onClick: function () {
      app.debug.log('MultiLayerImage::onClick(), this.id:', this.id);
      this.$emit('image-click', this.id);
    }

  };

  this.created = function ()
  {
    app.debug.log('MultiLayerImage::created(), this:', this);
  };

  this.updated = function ()
  {
    app.debug.log('MultiLayerImage::updated()');
  };

  this.destroyed = function ()
  {
    app.debug.log('MultiLayerImage::destroyed()');
  };
};


// TOWN MENU

app.viewComponents.TownMenu = function (template)
{
  this.template = template;
  this.props = ['town', 'currentArea'];

  this.data = function () {
    return {
      focussedItem: 'townmain'
    };
  };

  this.methods = {

    getClassName: function(currentArea, item)
    {
      var classNameObj = {};
      classNameObj.selected = (item.id === currentArea);
      classNameObj.hasfocus = (item.id === this.focussedItem);
      return classNameObj;
    },

    onClick: function (areaid) {
      app.debug.log('TownMenu::onClick(), areaid:', areaid);
      if (this.$options.components[areaid])
      {
        this.$emit('menu-select', areaid);
      }
    },

    onMouseLeave: function (event) {
      app.debug.log('TownMenu::onMouseLeave()');
      if (event && event.target)
      {
        var elements = event.target.getElementsByClassName('hasfocus');
        if (elements.length)
        {
          elements[0].classList.remove('hasfocus');
        }
      }
    },

    onMouseOver: function (event) {
      if (event && event.target)
      {
        app.debug.log('TownMenu::onMouseOver(), target:', event.target);
        var elements = event.target.parentElement.parentElement.getElementsByClassName('hasfocus');
        if (elements.length)
        {
          elements[0].classList.remove('hasfocus');
        }
        event.target.parentElement.classList.add('hasfocus');
        this.focussedItem = event.target.className;

      }
    },

    onMenuChangeFocus: function (direction) {

      app.debug.log('TownMenu::onMenuChangeFocus(), direction:', direction, ', this.$el:', this.$el);

      var $hasfocus, $next;

      $hasfocus = this.$el.getElementsByClassName('hasfocus')[0] || this.$el.getElementsByClassName('townmain')[0].parentElement;
      if ( ! $hasfocus.classList.contains('hasfocus'))
      {
        $hasfocus.classList.add('hasfocus');
      }

      app.debug.log('TownMenu::onMenuChangeFocus(), $hasfocus:', $hasfocus);

      if (direction === 'up')
      {
        $next = $hasfocus.previousElementSibling;
        if ($next) {
          $hasfocus.classList.remove('hasfocus');
          $next.classList.add('hasfocus');
          app.debug.log('TownMenu::onMenuChangeFocus(), $next:', $next);
          app.debug.log('TownMenu::onMenuChangeFocus(), $next.children[0].className:', $next.children[0].className);
          this.focussedItem = $next.children[0].className;
        }
      }

      else if (direction === 'down')
      {
        $next = $hasfocus.nextElementSibling;
        if ($next) {
          $hasfocus.classList.remove('hasfocus');
          $next.classList.add('hasfocus');
          app.debug.log('TownMenu::onMenuChangeFocus(), $next:', $next);
          app.debug.log('TownMenu::onMenuChangeFocus(), $next.children[0].className:', $next.children[0].className);
          this.focussedItem = $next.children[0].className;
        }
      }
    },

    onMenuSelect: function (event) {
      event.preventDefault();
      event.stopPropagation();
      app.debug.log('TownMenu::onMenuSelect(), this.focussedItem:', this.focussedItem);
      if (this.$options.components[this.focussedItem])
      {
        this.$emit('menu-select', this.focussedItem);
      }
    },

    onMenuEsc: function (event)
    {
      //if (event.done) { return; } //|| app.state.currentPage !== 'townpage'
      app.debug.log('TownMenu::onMenuEsc(), event:', event);
      //event.done = 'townmenu';
      app.setPage('gridpage');
    }
  };

  this.created = function ()
  {
    app.debug.log('TownMenu::created(), this:', this);
    app.events.$on('menu.change.focus', this.onMenuChangeFocus);
    app.events.$on('menu.select', this.onMenuSelect);
    app.events.$on('menu.esc', this.onMenuEsc);
  };

  this.updated = function ()
  {
    app.debug.log('TownMenu::updated()');
  };

  this.destroyed = function ()
  {
    app.debug.log('TownMenu::destroyed()');
    app.events.$off('menu.change.focus', this.onMenuChangeFocus);
    app.events.$off('menu.select', this.onMenuSelect);
    app.events.$off('menu.esc', this.onMenuEsc);
  };
};


// QUESTBOARD

app.viewComponents.QuestBoard = function (template)
{
  this.template = template;
  this.props = ['town'];

  this.computed = {
    area: function () {
      return this.town.areas[this.town.currentArea] || {};
    },
    quests: function () {
      return this.town.quests || [];
    },
    iconfile: function () {
      return 'img/Quest_Icon_' + lib.randomNumber(1, 5) + '.png';
    }
  };

  this.methods = {
    getWorld: function () { return app.objects.world; },

    onAcceptQuest: function (quest)
    {
      app.debug.log('QuestBoard::onAcceptQuest()');
      this.$emit('quest-accepted', quest);
      this.$forceUpdate();
    },

    onClaimReward: function (quest)
    {
      app.debug.log('QuestBoard::onAcceptQuest()');
      this.$emit('quest-claim', quest);
      this.$forceUpdate();
    }
  };

  this.filters = {
    capitalize: lib.capitalize
  };
};


// TOWN MAIN AREA

app.viewComponents.TownMain = function (template)
{
  this.template = template;
  this.props = ['town'];

  this.computed = {
    area: function () {
      return this.town.areas[this.town.currentArea] || {};
    }
  };

  this.methods = {

    getWorld: function () { return app.objects.world; },

    onImageClick: function () {
      app.debug.log('TownMainArea::onImageClick()');
      app.setPage('gridpage', this.getWorld());
    }
  };
};


// TOWN TAVERN AREA

app.viewComponents.Tavern = function (template)
{
  this.template = template;
  this.props = ['town'];

  this.computed = {
    area: function () {
      return this.town.areas[this.town.currentArea] || {};
    },
    npcimages: function () {
      return this.town.npcs[0].images || [];
    }
  };

  this.methods = {

    getWorld: function () { return app.objects.world; },

    onImageClick: function () {
      app.debug.log('Tavern::onImageClick()');
      app.setPage('gridpage', this.getWorld());
    }
  };
};


// TOWN PAGE

app.viewComponents.TownPage = function (template)
{
  this.template = template;

  this.data = function () {
    return {
      name: app.state.pageModel.name || 'noname',
      sectorid: app.state.pageModel.sectorid,
      currentArea: 'townmain'
    };
  };

  this.computed = {
    sector: function () {
      return (typeof this.sectorid !== 'undefined') ? app.objects.world.sectors[this.sectorid] : {};
    },
    town: function () {
      return (typeof this.sector.placeid !== 'undefined') ? app.objects.world.places[this.sector.placeid] : {};
    }
  };

  this.methods = {

    getWorld: function () { return app.objects.world; },

    //onMenuClick: function (itemid) {
      //app.debug.log('TownPage::onMenuClick(), itemid:', itemid);
      //var $selected = this.$el.getElementsByClassName('selected');
      //if ($selected.length)
      //{
        //$selected[0].classList.remove('selected');
      //}
      //this.currentArea = itemid;
    //},

    onMenuSelect: function (itemid)
    {
      app.debug.log('TownPage::onMenuSelect(), itemid:', itemid);
      this.currentArea = itemid;
    },

    onQuestAccepted: function (quest) {
      app.debug.log('TownPage::onQuestAccepted(), quest:', quest);
      this.$emit('quest-accepted', quest);
    },

    onClaimReward: function (quest) {
      app.debug.log('TownPage::onClaimReward(), quest:', quest);
      this.$emit('quest-claim-reward', quest);
    },
  };

  this.created = function ()
  {
    app.debug.log('TownPage::created(), this:', this);
    app.debug.log('TownPage::created(), this.name:', this.name);
    app.debug.log('TownPage::created(), this.sectorid:', this.sectorid);
    app.keyboardMode = 'menu';
  };

  this.updated = function ()
  {
    app.debug.log('TownPage::updated()');
  };

  this.destroyed = function ()
  {
    app.debug.log('TownPage::destroyed()');
    app.keyboardMode = 'player';
  };

};


// GRID PAGE

app.viewComponents.GridPage = function (template)
{
  this.template = template;

  this.data = function () {
    return {
      playerSectorId: app.objects.world.player.sectorid
    };
  };

  this.computed = {

    player: function () {
      var player = this.getPlayer();
      app.debug.log('GridPage::compute().player =', player);
      return player;
    },

    playerStyle: function ()
    {
      var sector, style = {};
      sector = this.getWorld().sectors[this.playerSectorId];
      style.position = 'absolute';
      style.top = (2 + sector.row * 36) + 'px';
      style.left = (2 + sector.col * 36) + 'px';
      //app.debug.log('GridPage::compute().playerStyle =', style);
      return style;
    }

  };

  this.methods = {

    getWorld: function () { return app.objects.world; },

    getPlayer: function ()
    {
      app.debug.log('GridPage::getPlayer()');
      return app.objects.world.player;
    },

    getPlace: function (placeid)
    {
      return this.getWorld().places[placeid];
    },

    getSectorClassName: function(sector)
    {
      var classNameObj = {};
      classNameObj.hasQuest = sector.quests.length && sector.quests[0].status==='assigned';
      classNameObj.completed = sector.quests.length && sector.quests[0].status==='completed';
      return classNameObj;
    },

    onPlaceClick: function (sectorid)
    {
      var world = this.getWorld(),
        sector = world.sectors[sectorid] || {},
        place = world.places[sector.placeid],
        quest;

      app.debug.log('GridPage::onPlaceClick(), sectorid:', sectorid, ', sector:', sector, ', place:', place);

      app.debug.log('GridPage::onPlaceClick(), sector.hasQuest:', sector.hasQuest);
      if (sector.hasQuest)
      {
        quest = lib.findObjInArray(sector.quests, 'status', 'assigned');
        app.debug.log('GridPage::onPlaceClick(), quest:', quest);
        if (quest)
        {
          quest.status = "completed";
          sector.quests = lib.removeObjFromArray(sector.quests, quest);
          this.$forceUpdate();
          return;
        }
        app.debug.log('GridPage::onPlaceClick(), sector.quests:', sector.quests);
        sector.hasQuest = sector.quests.length > 0;
      }

      if ( ! place) { return; }

      switch (sector.type)
      {
        case 'town':
          app.setPage('townpage', world.places[sector.placeid]);
          break;
      }
    },

    onPlayerClick: function ()
    {
      app.debug.log('GridPage::onPlayerClick()');
    },

    onPlayerMove: function (direction)
    {
      app.debug.log('GridPage::onPlayerMove(), direction:', direction);
      this.player.changeSector(direction);
      this.playerSectorId = this.player.sectorid;
    },

    onPlayerEnter: function (event, sectorid)
    {
      app.debug.log('GridPage::onPlayerEnter(), event:', event, ', sectorid:', sectorid);
      this.onPlaceClick(sectorid);
      return false;
    }
  };

  this.created = function ()
  {
    app.debug.log('GridPage::created()');
    app.events.$on('player.move', this.onPlayerMove);
    app.events.$on('player.enter', this.onPlayerEnter);
  };

  this.updated = function ()
  {
    app.debug.log('GridPage::updated()');
  };

  this.mounted = function ()
  {
    app.debug.log('GridPage::mounted()');
    // Find the hidden dummy-button to take focus instead of actual ACTION buttons when we switch to "Grid View"
    var hbtn = document.getElementById('hbtn');
    app.debug.log('GridPage::mounted(), hbtn:', hbtn);
    if (hbtn)
    {
      setTimeout(
        function() { hbtn.focus(); },
        100
      );
    }
  }

  //this.activated = function ()
  //{
    //app.debug.log('GridPage::activated(), this:', this);
  //};

  //this.deactivated = function ()
  //{
    //app.debug.log('GridPage::deactivated()');
  //};

  this.destroyed = function ()
  {
    app.debug.log('GridPage::destroyed()');
    app.events.$off('player.move', this.onPlayerMove);
    app.events.$off('player.enter', this.onPlayerEnter);
  };
};


// APP VIEW

app.viewModelProto = {

  data: {

    playerXp: 0,
    playerLevel: 1,
    playerCredits: 0,
    playerItems: null,
    playerQuests: null,
    playerName: '',

    currentPage: app.state.currentPage
  },

  methods: {

    getWorld: function ()
    {
      return app.objects.world;
    },

    getPlayer: function ()
    {
      app.debug.log('APP::getPlayer()');
      return app.objects.world.player;
    },

    gotoPage: function (page, model)
    {
      app.debug.log('APP::gotoPage(), page:', page, ', model:', model, ', this:', this);
      app.setPage(page, model);
    },

    onClick: function (source, action, params)
    {
      app.debug.log('APP::onClick(), source:', source, ', action:', action, ', params:', params);

      switch (action)
      {
        case 'goto':
          this.gotoPage(params.page, params.model);
          break;
      }
    },

    onGoUp: function (event)
    {
      //app.debug.log('APP::onGoUp(), event:', event, ', kbmode:', app.keyboardMode);

      switch (app.keyboardMode)
      {
        case 'player' : return app.events.$emit('player.move'    , 'up');
        case 'menu'   : return app.events.$emit('menu.change.focus' , 'up');  // Any visible menus should KNOW if they are the "active" menu!
      }
    },

    onGoDown: function (event)
    {
      //app.debug.log('APP::onGoDown(), event:', event, ', kbmode:', app.keyboardMode);

      switch (app.keyboardMode)
      {
        case 'player' : return app.events.$emit('player.move'    , 'down');
        case 'menu'   : return app.events.$emit('menu.change.focus' , 'down');
      }
    },

    onGoLeft: function (event)
    {
      //app.debug.log('APP::onGoLeft(), event:', event, ', kbmode:', app.keyboardMode);

      switch (app.keyboardMode)
      {
        case 'player' : return app.events.$emit('player.move'    , 'left');
        case 'menu'   : return app.events.$emit('menu.change.focus' , 'left');
      }
    },

    onGoRight: function (event)
    {
      //app.debug.log('APP::onGoRight(), event:', event, ', kbmode:', app.keyboardMode);

      switch (app.keyboardMode) {
        case 'player' : return app.events.$emit('player.move'    , 'right');
        case 'menu'   : return app.events.$emit('menu.change.focus' , 'right');
      }
    },

    onEnter: function (event)
    {
      app.debug.log('APP::onEnter(), event:', event, ', kbmode:', app.keyboardMode);

      switch (app.keyboardMode)
      {
        case 'player' : return app.events.$emit('player.enter', event, app.objects.world.player.sectorid);
        case 'menu'   : return app.events.$emit('menu.select', event);
      }
    },

    onEsc: function (event)
    {
      app.debug.log('APP::onEsc(), event:', event, ', kbmode:', app.keyboardMode);

      switch (app.keyboardMode)
      {
        case 'menu': return app.events.$emit('menu.esc', event);
      }
    },

    onQuestAccepted: function (quest)
    {
      app.debug.log('APP::onQuestAccepted(), quest:', quest);
      quest.status = "assigned";
      this.playerQuests.push(quest);
      // Take the focus on some element that will respond to the "ESC" key.
      // Use the "Town Main" button as focus target.
      var hbtns = document.getElementsByClassName('townmain');
      app.debug.log('APP::onQuestAccepted(), hbtns:', hbtns);
      if (hbtns && hbtns.length)
      {
        setTimeout(
          function() {
            app.debug.log('APP::onQuestAccepted(), FOCUS HBTN!', quest);
            hbtns[0].focus();
          },
          100
        );
      }
    },

    onClaimReward: function (quest)
    {
      app.debug.log('APP::onClaimReward(), quest:', quest);
      quest.status = "closed";
      this.playerXp += quest.reward.xp || 0;
      this.playerCredits += quest.reward.credits || 0;
      this.playerItems = this.playerItems.concat(quest.reward.items || []);
      this.playerLevel = ((this.playerXp / 2500) + 1)|0;
      this.playerQuests = lib.removeObjFromArray(this.playerQuests, quest);
    }
  },

  created: function ()
  {
    var player = this.getPlayer();
    app.debug.log('APP::created(), player:', player);
    this.playerXp = player.xp;
    this.playerName = player.name;
    this.playerCredits = player.credits;
    this.playerItems = player.items;
    this.playerQuests = player.quests;
  }
};


// APP MODEL

app.keysDown = {};
app.keysPressed = {};
app.events = new Vue();
app.keyboardMode = 'player';


app.pickRandomGridPosition = function (cmax, rmax)
{
  app.debug.log('APP::pickRandomGridPosition(), cmax:', cmax, ', rmax:', rmax);
  return new app.classes.GridPosition(lib.randomNumber(cmax), lib.randomNumber(rmax));
};

app.onKeyUp = function (event)
{
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if (keycode in this.keysDown) { delete this.keysDown[keycode]; }
  event.preventDefault();
};

app.onKeyDown = function (event)
{
  //debug.log('this.onKeyDown(), event =', event);
  var keycode = (event.keyCode ? event.keyCode : event.which),
    preventDefault = false;
  app.keysDown[keycode] = true;
  app.keysPressed[keycode] = true;
  if (keycode === 40)    { app.viewModel.onGoDown(event);  } // Go Down: Down Arrow
  else if (keycode === 38) { app.viewModel.onGoUp(event);    } // Go Up: Up Arrow
  else if (keycode === 39) { app.viewModel.onGoRight(event); } // Go Right: Right Arrow
  else if (keycode === 37) { app.viewModel.onGoLeft(event);  } // Go Left: Left Arrow
  else if (keycode === 13) { app.viewModel.onEnter(event);   } // Enter Key
  else if (keycode === 27) { app.viewModel.onEsc(event);     } // Escape Key
  return !preventDefault;
};

app.setPage = function (page, model)
{
  page = page || app.config.initialPage;
  model = model || app.config.states[page].model();
  app.debug.log('APP::setPage(), page:', page, ', model:', model);
  app.debug.log('APP::setPage(), app.viewModel:', app.viewModel);
  app.state.pageModel = model;
  app.state.currentPage = page;
  app.viewModelProto.data.currentPage = page;
  if ( ! app.viewModel)
  {
    app.viewModel = new Vue(app.viewModelProto).$mount('#app');
  }
  else
  {
    app.viewModel.currentPage = page;
  }
  app.debug.log('APP::STATE:');
  app.debug.dir(app.state);
};

app.init = function (initialPage)
{
  app.debug.log('APP::INIT - Initial Page:', initialPage);
  app.objects.world = new app.classes.World(
    app.config.worldSectorColCount,
    app.config.worldSectorRowCount
  );
  app.setPage(initialPage);
  app.debug.log('APP::INIT - Done');
};

app.restart = function (restartPage)
{
  restartPage = restartPage || app.state.currentPage;
  app.debug.log('APP::RESTART - Restart Page:', restartPage);
  app.events = new Vue();
  app.viewModel.$destroy();
  app.viewModel = null;
  app.init(restartPage);
  app.debug.log('APP::RESTART, Done');
};


// LOAD VIEW TEMPLATES

axios.all([

  axios.get('data/appdata.json'),
  axios.get('tpl/gridpage.html'),
  axios.get('tpl/townpage.html'),
  axios.get('tpl/townmenu.html'),
  axios.get('tpl/townmain.html'),
  axios.get('tpl/tavern.html'),
  axios.get('tpl/questboard.html'),
  axios.get('tpl/multilayerimage.html'),
  axios.get('tpl/applayout.html')

])


// THEN: BOOTSTRAP APP

.then(axios.spread(function (

  appdata_resp,
  gridpage_template_resp,
  townpage_template_resp,
  townmenu_template_resp,
  townmain_template_resp,
  tavern_template_resp,
  questboard_template_resp,
  multilayerimage_template_resp,
  applayout_template_resp

){

  // BOOT APP
  app.debug.log('APP::BOOT - Start');

  app.data = appdata_resp.data;

  app.debug.log('APP::BOOT - App Data Loaded, data:', app.data);

  app.questGrammar = tracery.createGrammar(app.data.questGrammar);

  // CREATE VIEW COMPONENTS
  Vue.component('gridpage', new app.viewComponents.GridPage(gridpage_template_resp.data));
  Vue.component('townpage', new app.viewComponents.TownPage(townpage_template_resp.data));
  Vue.component('townmenu', new app.viewComponents.TownMenu(townmenu_template_resp.data));
  Vue.component('townmain', new app.viewComponents.TownMain(townmain_template_resp.data));
  Vue.component('tavern', new app.viewComponents.Tavern(tavern_template_resp.data));
  Vue.component('questboard', new app.viewComponents.QuestBoard(questboard_template_resp.data));
  Vue.component('multilayer-image', new app.viewComponents.MultiLayerImage(multilayerimage_template_resp.data));

  app.viewModelProto.template = applayout_template_resp.data;

  app.debug.log('APP::BOOT - Templates Loaded');

  // **** START ****
  app.init(app.config.initialPage);

  app.debug.log('APP::BOOT - Done');

}));
