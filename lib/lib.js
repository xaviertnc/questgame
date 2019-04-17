lib = {

	isArray: function (obj) {
		return !!obj.indexOf;
	},

	findObjInArray: function (arr, searchProp, searchVal)
	{
		var result = arr.filter(function(obj) { return obj[searchProp] === searchVal; });
		app.debug.log('lib.findObjInArray(), arr:', arr, ', searchProp =', searchProp, ', searchVal =', searchVal, ', result =', result);
		return result && result.length ? result[0] : null;
	},

	removeObjFromArray: function (arr, objToRemove, objMatchProp)
	{
		if ( ! objToRemove) { return arr; }
		objMatchProp = objMatchProp || 'id';
		return arr.filter(function(listObj) { return listObj[objMatchProp] !== objToRemove[objMatchProp]; });
	},

	capitalize : function(s) {
		return s.charAt(0).toUpperCase() + s.substring(1);
	},

	randomNumber: function (max, min)
	{
		min = min || 0;
		var dn = (max || 100) - min;
		return min + (Math.random()*dn)|0;
	},

	pickRandomItem: function (list)
	{
		var itemCount = list.length;
		if (!itemCount) { return; }
		return list[lib.randomNumber(itemCount)];
	},

	pickRandomItems: function (list, maxItems)
	{
		for (var i = 0, n = lib.randomNumber(3), items = []; i < n; i++) {
			items.push(lib.pickRandomItem(list));
		}
		return items;
	},

	defPropabilityFn : function () { return 0.5; },

	excludeRandomItems: function (list, maxItems, mustIncludeFn, itemPropabilityFn)
	{
		maxItems = maxItems || list.length;
		if ( ! mustIncludeFn) { mustIncludeFn = $.noop; }
		if ( ! itemPropabilityFn) { itemPropabilityFn = lib.defPropabilityFn; }
		//app.debug.log('lib.excludeRandomItems(), maxItems =', maxItems, ', mustIncludeFn =', mustIncludeFn, ', itemPropabilityFn =', itemPropabilityFn);
		for (var i = 0, n = list.length, items = [], item = null; i < n; i++) {
			item = list[i];
			if (mustIncludeFn(item) || Math.random() > itemPropabilityFn(item))
			{
				items.push(item);
				if (items.length > maxItems) { break; }
			}
		}
		return items;
	},

	lpad: function (str, length, padString) //pads left
	{
		str = str.toString();
		if (!padString) { padString = '0'; }
		while (str.length < length) { str = padString + str; }
		//app.debug.log('lib.lpad(), str =', str);
		return str;
	},

	rpad: function (str, length, padString) //pads right
	{
		str = str.toString();
		if (!padString) { padString = '0'; }
		while (str.length < length) { str = str + padString; }
		return str;
	}
};
