/*global Handlebars */

function Article (opts) {
  Object.keys(opts).forEach(function(e, index, keys) {
    this[e] = opts[e];
  },this);
  // converts markdown property into html unsing marked library and assign result to body property
  this.body = opts.body || marked(this.markdown);
  // console.log(this.id);
  //
  //
  //
  // shortcut to show off if requested - show on a later date
  // Object.keys(opts).forEach(function(e, index, keys) {
  //   this[e] = opts[e];
  // },this);
  // this.author = opts.author;
  // this.authorUrl = opts.authorUrl;
  // this.title = opts.title;
  // this.category = opts.category;
  // this.markdown = opts.markdown;
  // this.body = opts.body || marked(this.markdown);
  // this.publishedOn = opts.publishedOn;
}

Article.prototype.template = '';

Article.prototype.toHtml = function() {
  if (!blog.isAdmin() && !this.publishedOn) {
    return '';
  }
  this.daysAgo =
    parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);

  this.publishStatus = this.publishedOn ? 'published ' + this.daysAgo + ' days ago' : '(draft)';
  this.authorSlug = util.slug(this.author);
  this.categorySlug = util.slug(this.category);

  return this.template(this);
};

Article.prototype.insertRecord = function(callback) {
	//console.log("hello");
	/*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], callback
    */
  // insert article record into database
  webDB.execute(
    [
      {
        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
        'data': [this.title, this.author, this.authorUrl, this.category, this.publishedOn, this.body],
      }
    ],
    callback
  );
};

Article.prototype.updateRecord = function(callback) {
	/*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], callback
    */
  //update article record in databse
   webDB.execute(
    [
      {
        'sql': 'UPDATE articles SET title = ?, author = ?, authorUrl = ?, category = ?, publishedOn = ?, body = ? WHERE id = ?;',
        'data': [this.title, this.author, this.authorUrl, this.category, this.publishedOn, this.body, this.id]
      }
    ],
    callback
  );
};

Article.prototype.deleteRecord = function(callback) {
	/*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], callback
    */
  // Delete article record in database
  webDB.execute(
    [
      {
        'sql': 'DELETE FROM articles WHERE id = ?;',
        'data': [this.id]
      }
    ],
    callback
  );
};

Article.all = [];

Article.loadAll = function(callback) {
  var callback = callback || function() {};

  if (Article.all.length === 0) {
    webDB.execute('SELECT * FROM articles ORDER BY publishedOn;',
      function(rows) {
        if (rows.length === 0) {
          // Request data from server, then try loading from db again:
          Article.requestAll(Article.loadAll, callback);
        } else {
          rows.forEach(function(row) {
            Article.all.push(new Article(row));
          });
          callback();
        }
      }
    );
  } else {
    callback();
  }
};

Article.find = function(id, callback) {
  webDB.execute(
    [
      {
        'sql': 'SELECT * FROM articles WHERE id = ?',
        'data': [id]
      }
    ],
    callback
  );
};


Article.prototype.truncateTable = function(callback) {
	/*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], blog.fetchJSON
    */
  // Delete all records from given table.
  webDB.execute(
    // TODO: Add SQL here...
     [{
    	'sql': 'TRUNCATE TABLE articles;'
    }],
    callback
  );
};
