var util = {};

util.slug = function(str) {
	//replaces non alphanumeric characters with a string?
  return str.replace(/\W/g, '-');
};

util.today = function() {
  return (new Date()).toISOString().slice(0,10);
};

util.getParameterByKey = function (key) {
  // Return a value stored in a given key from browser query string. And if it doesn't find it, it returns a string.
  // regular expressions p.612 ? plus key passed in above, plus = sign  (e.g ?admin=)
  var match = RegExp('[?&]' + key + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};

Handlebars.registerHelper('if_admin', function (block) {
  // creates an if else helper for the article.handlebars template
  var admin = util.getParameterByKey('admin');
  if (admin === 'true') {
    return block.fn(this);
  }
  return block.inverse(this);
});
