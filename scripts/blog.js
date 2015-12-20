var blog = blog || {};
blog.articles = [];

var eTag;

blog.loadArticles = function() {
	// gets the template and assigns it to the template method of the Article object -
  $.get('templates/article.handlebars', function(data, message, xhr) {
  	//console.log('Am I admin?' , blog.isAdmin());
  	// how does it compile if there is no data yet?
  	// Handlebars compiles the template into a callable function and this assigns that function the the prototype of the Article object making it a method of the Article object.
    Article.prototype.template = Handlebars.compile(data);
    $.ajax({
      type: 'HEAD',
      url: 'scripts/blogArticles.json',
      success: blog.fetchArticles
    });
  });
};

blog.fetchArticles = function(data, message, xhr) {
  eTag = xhr.getResponseHeader('eTag');
  localStorage.clear(); //-- can uncomment out to clear localStorage for testing purposes
  if (typeof localStorage.articlesEtag == 'undefined' || localStorage.articlesEtag != eTag) {
    console.log('cache miss!');
    // don't set untile me have?
    //localStorage.articlesEtag = eTag;

    // Remove all prior articles from the DB, and from blog:
    // empties out array?
    blog.articles = [];
    // wait until initial table created from webDB.init(); in index.js then call fetchJSON
    // TODO: is there a way to get around the webDB.defer?
    webDB.defer(blog.fetchJSON);
  } else {
    console.log('cache hit!');
    blog.fetchFromDB();
  }
};

blog.fetchJSON = function() {
	webDB.execute(
    	// TODO: Add SQL here...
    	[
    	{
  			'sql': 'DROP TABLE articles;'
		},
		{
  			'sql': 'CREATE TABLE IF NOT EXISTS articles (title VARCHAR(255) NOT NULL, author VARCHAR(255) NOT NULL, authorUrl VARCHAR (255), category VARCHAR(20), publishedOn DATETIME, body TEXT NOT NULL);'
		},
		], function(){
			blog.fetchJSON2();
		}
	);
};

blog.fetchJSON2 = function() {
	$.getJSON('scripts/blogArticles.json', blog.updateFromJSON);
};

// Drop old records and insert new into db and blog object:
blog.updateFromJSON = function (data) {
  // Iterate over new article JSON:
  data.forEach(function(item) {

    // Instantiate an article based on item from JSON:
    var article = new Article(item);

    // Add the article to blog.articles
    blog.articles.push(article);
    console.log(article.body);
    // Cache the article in DB
    // TODO: Trigger SQL here...
    article.insertRecord();
  });
  // now safe to set eTag?
  //localStorage.articlesEtag = eTag;
  blog.initArticles();
};

blog.fetchFromDB = function(callback) {
  callback = callback || function() {};
  	/*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], blog.fetchJSON
    */
  // Fetch all articles from db.
  webDB.execute(
    // TODO: Add SQL here...
    [{
    	'sql': 'SELECT * FROM articles;'
    }],
    function (resultArray) {
      resultArray.forEach(function(ele) {
        blog.articles.push(new Article(ele));
      });

      blog.initArticles();
      callback();
    }
  );
};

blog.initArticles = function() {
  blog.sortArticles();

  // Only render if the current page has somewhere to put all the articles
  // if called from new.html, there would be nowhere to put all the articles.
  if ($('#articles').length) {
    blog.render();
  }
};

// How Sorting works p.556
blog.sortArticles = function() {
  blog.articles.sort(function(a,b) {
    return a.publishedOn < b.publishedOn;
  });
};

blog.render = function() {
  blog.articles.forEach(blog.appendArticle);
  // DO we need a call the the database here? or is it cached above?
  /*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], blog.fetchJSON
    */
  // Get all articles from the DB to render:
  // webDB.execute(
  //   // TODO: Add SQL here...
  //   'SELECT * FROM articles;',
  //   function(results) {
  //   results.forEach(function(ele) { blog.appendArticle(ele); });
  // });

  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });

  blog.setTeasers();
  blog.populateFilters();
};

blog.appendArticle = function(a) {
  $('#articles').append((new Article(a)).toHtml());
};

blog.isAdmin = function () {
  var admin = util.getParameterByKey('admin');
  // can you use teriary operator? (admin==='true') ? true:false;
  if (admin === 'true') {
    return true;
  }
  return false;
};

blog.setTeasers = function() {
  $('.article-body').children(':nth-child(n+2)').hide();
  $('#articles').on('click', 'a.read-on', function(e) {
    e.preventDefault();
    $(this).parent().find('.edit-btn').show();
    $(this).prev('.article-body').children().show();
    $(this).hide();
  });
};

blog.populateFilters = function() {
  $('article').each(function() {
    if (!$(this).hasClass('draft')) {
      var val = $(this).find('address a').text();
      if ($('#author-filter option[value="' + val + '"]').length === 0) {
        var option = '<option value="' + val + '">' + val + '</option>';
        $('#author-filter').append(option);
      }

      val = $(this).data('category');
      if ($('#category-filter option[value="' + val + '"]').length === 0) {
        option = '<option value="' + val + '">' + val + '</option>';
        $('#category-filter').append(option);
      }
    }
  });
};

blog.handleAuthorFilter = function() {
  $('#author-filter').on('change', function() {
    if ($(this).val()) {
      $('article').hide();
      $('article[data-author="' + util.slug($(this).val()) + '"]').fadeIn();
    } else {
      $('article').fadeIn();
      $('article.draft').hide();
    }
    $('#category-filter').val('');
  });
};

blog.handleCategoryFilter = function() {
  $('#category-filter').on('change', function() {
    if ($(this).val()) {
      $('article').hide();
      $('article[data-category="' + util.slug($(this).val()) + '"]').fadeIn();
    } else {
      $('article').fadeIn();
      $('article.draft').hide();
    }
    $('#author-filter').val('');
  });
};

blog.handleMainNav = function() {
  $('.main-nav').on('click', '.tab', function() {
    $('.tab-content').hide();
    $('#' + $(this).data('content')).fadeIn();
  });
  $('.main-nav .tab:first').click();
};

//----------------------- Functions for New and Edit html pages ------------------------//

blog.initNewArticlePage = function() {
  $.get('templates/article.handlebars', function(data, msg, xhr) {
    Article.prototype.template = Handlebars.compile(data);
  });

  $('.tab-content').show();
  $('#export-field').hide();
  $('#article-json').on('focus', function(){
    this.select();
  });
  blog.checkForEditArticle();
  blog.watchNewForm();
};

blog.initArticleEditorPage = function() {
  $.get('../templates/article.handlebars', function(data, msg, xhr) {
    Article.prototype.template = Handlebars.compile(data);
  });

  $('.tab-content').show();
  $('#export-field').hide();
  $('#article-json').on('focus', function(){
    this.select();
  });
  blog.checkForEditArticle();
  blog.watchNewForm();
};

blog.checkForEditArticle = function () {
  if (util.getParameterByKey('id')) {
    var id = util.getParameterByKey('id');
    blog.loadArticleById(id);
    $('#add-article-btn').hide();
    $('#update-article-btn').show().data('article-id', id);
    $('#delete-article-btn').show().data('article-id', id);
    console.log('Found article to edit.');
  } else {
    console.log('No article to edit.');
  }
};

blog.loadArticleById = function (id) {
	/*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], blog.fetchJSON
    */
  // Grab just the one article from the DB
  webDB.execute(
    // TODO: Add SQL here...
    [
      {
    	'sql': 'SELECT id FROM articles WHERE id=' + id +  ';'
	  }
	], function (resultArray) {
      if (resultArray.length === 1) {
        blog.fillFormWithArticle(resultArray[0]);
      }
    }
  );
};

blog.fillFormWithArticle = function (a) {
  var checked = a.publishedOn ? true : false;
  $('#preview').empty();
  $('#article-title').val(a.title);
  $('#article-author').val(a.author);
  $('#article-author-url').val(a.authorUrl);
  $('#article-category').val(a.category);
  $('#article-body').val(a.markdown);
  $('#article-published').attr('checked', checked);
  blog.buildPreview(); // Show the initial preview
};

blog.watchNewForm = function() {
  $('#new-form').on('change', 'input, textarea', blog.buildPreview);
};

blog.buildPreview = function() {
  var article = blog.buildArticle();
  $('#preview').html(article.toHtml());

  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });
};

blog.buildArticle = function() {
  return new Article({
    title: $('#article-title').val(),
    author: $('#article-author').val(),
    authorUrl: $('#article-author-url').val(),
    category: $('#article-category').val(),
    markdown: $('#article-body').val(),
    publishedOn: $('#article-published:checked').length ? util.today() : null
  });
};

blog.exportJSON = function() {
  console.log('exportJSON');
  $('#export-field').show();
  var output = '';
  blog.articles.forEach(function(article) {
    output += JSON.stringify(article) + ",\n";
  });
  $('#article-json').val('[' + output + '{"markdown":""}]');
};

blog.clearNewForm = function () {
  $('#articles').empty();
  $('#article-title').val('');
  $('#article-author').val('');
  $('#article-author-url').val('');
  $('#article-category').val('');
  $('#article-body').val('');
  $('#article-published').attr('checked', false);
  $('#add-article-btn').show();
  $('#update-article-btn').hide();
  $('#delete-article-btn').hide();
};

blog.clearAndFetch = function () {
  blog.articles = [];
  blog.fetchFromDB(blog.exportJSON);
};

blog.handleAddButton = function () {
  $('#add-article-btn').on('click', function (e) {
    var article = blog.buildArticle();

    // Insert this new record into the DB, then callback to blog.clearAndFetch
    // TODO: Trigger SQL here...
    article.insertRecord(article);
    blog.clearAndFetch();
  });
};

blog.handleUpdateButton = function () {
  $('#update-article-btn').on('click', function () {
    var id = $(this).data('article-id');
    var article = blog.buildArticle();
    article.id = id;
    /*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], blog.fetchJSON
    */
    // Save changes to the DB:
    // TODO: Trigger SQL here...
    article.upadateRecord(id);
    blog.clearAndFetch();
  });
};

blog.handleDeleteButton = function () {
  $('#delete-article-btn').on('click', function () {
    var id = $(this).data('article-id');
    /*
 		[
	      {
	        'sql': 'INSERT INTO articles (title, author, authorUrl, category, publishedOn, body) VALUES (?, ?, ?, ?, ?, ?);',
	        'data': [a.title, a.author, a.authorUrl, a.category, a.publishedOn, a.body],
	      }
	    ], blog.fetchJSON
    */
    // Remove this record from the DB:
    webDB.execute(
    // TODO: Add SQL here...
     [{
    	'sql': 'DELETE FROM articles WHERE id = ' + id + ';'
    }], blog.clearAndFetch);
    //blog.clearNewForm();
  });
};
