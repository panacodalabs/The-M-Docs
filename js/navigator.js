var forcedHashChange = false;

function registerArticles() {
    $('.nav li h3').each(function() {
        var category = $(this).text().toLocaleLowerCase().replace(/[\.\s-]+/g, '_');
        category = category.replace(/[\?]+/g, '');
        $(this).bind('click', function(evt) {
            collapseCategory($(this).siblings('ul .subnav'));
        });
        $(this).siblings('ul .subnav').each(function() {
            $(this).find('li').each(function() {
                var path = category + '/' + $(this).text().toLocaleLowerCase().replace(/[\.\s-]+/g, '_');
                path = path.replace(/[\?]+/g, '');
                $(this).bind('click', function() {
                    loadArticle(path);
                });
            });
        });
    });
}

function loadArticle(path, firstTry, isBack, searchString) {
    if (path === '404' && !firstTry) {
        return;
    }

    $.ajax({
        url: 'content/' + path + '.html',
        success: function(data) {
            if(searchString && searchString != '') {
                var results = find(searchString);
                data = data.replace(/<%= searchString %>/g, searchString);
                data = data.replace(/<%= numResults %>/g, results.length);
            } else {
                data = data.replace(/<%= searchString %>/g, '');
                data = data.replace(/<%= numResults %>/g, 0);
            }
            
            $('#container').html(data);
            scroll('top', true);
            $.syntax({
                blockLayout: "plain"
            });

            if(!isBack && !searchString) {
                window.location.hash = path;
                forcedHashChange = true;
            }

            /* now update the dom and enter the search results */
            if(searchString && searchString != '') {
                showSearchResults(searchString, results);
            }
        },
        error: function(xhr, error) {
            loadArticle('404', firstTry ? false : true);
        }
    });
}

function collapseCategory(category) {
    category.children().each(function() {
        $(this).toggle();
    })
}

function scroll(anchor, disableAnimation) {
    if(disableAnimation) {
        window.scrollTo(0, 0);
    } else {
        $('html, body').animate({
            scrollTop: anchor === 'top' ? 0 : $('a[name="' + anchor + '"]').offset().top - $('#content').offset().top
        }, 'slow');
    }
}

function filter(predicate) {
    $("ul.subnav li").each(function() {
        if($(this).text().toLowerCase().indexOf(predicate.toLowerCase()) !== -1) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

function fireSearch() {
    var searchString = $('#search').val();
    //searchString = searchString.replace(/[\/\(\)\[\]\.\?\*]*/g, '');
    loadArticle('search', false, false, searchString ? searchString : '');
    //$('#search').focus();
}

function generateIndex() {
    /* register keyup event to search bar */
    $('#search').bind('keyup', function(evt) {
        //if(evt.keyCode === 13) {
            fireSearch();
        //}
    });

    /* register keyup event to search button */
    $('#searchButton').bind('click', function(evt) {
        fireSearch();
    });

    /* register focus event to search bar */
    $('#search').bind('focus', function(evt) {
        $('#search').val('');
    });

    /* build index */
    index = {};
    $('.nav li h3').each(function() {
        var category = $(this).text().toLocaleLowerCase().replace(/[\.\s\?-]+/g, '_');
        $(this).siblings('ul .subnav').each(function() {
            $(this).find('li').each(function() {
                var path = category + '/' + $(this).text().toLocaleLowerCase().replace(/[\.\s\?-]+/g, '_');
                var text = $(this).text();
                $.ajax({
                    url: 'content/' + path + '.html',
                    success: function(data) {
                        var regex = /<[\s]*p[\s]+class[\s]*={1}[\s]*"{1}[\s]*[^"]*text{1}[^"]*"{1}[\s]*>{1}[A-Za-z0-9\s,;_\.:\?\/\(\)'\-"<>=]*<\/p>/g;
                        var regexResult = data.match(regex);
                        var content = '';
                        if(regexResult) {
                            for (var i = 0; i < regexResult.length; ++i) {
                                var tmp = regexResult[i].replace(/<[^>]*>([\S\s]+)<\/[^>]*>/g, RegExp.$1 || '$1');
                                tmp = tmp.replace(/<span[A-Za-z\s0-9="\/\(\)'_;]*>/g, '');
                                tmp = tmp.replace(/<p[A-Za-z\s0-9="\/\(\)'_;]*>/g, '');
                                tmp = tmp.replace(/<img[A-Za-z\s0-9="\/\(\)'_;\.]*>/g, '');
                                tmp = tmp.replace(/<pre[A-Za-z\s0-9="\/\(\)'_;]*>/g, '');
                                tmp = tmp.replace(/<div[A-Za-z\s0-9="\/\(\)'_;]*>/g, '');
                                tmp = tmp.replace(/<ul[A-Za-z\s0-9="\/\(\)'_;]*>/g, '');
                                tmp = tmp.replace(/<li[A-Za-z\s0-9="\/\(\)'_;]*>/g, '');
                                tmp = tmp.replace(/<\/span>/g, '');
                                tmp = tmp.replace(/<\/p>/g, '');
                                tmp = tmp.replace(/<\/img>/g, '');
                                tmp = tmp.replace(/<\/pre>/g, '');
                                tmp = tmp.replace(/<\/li>/g, '');
                                tmp = tmp.replace(/<\/ul>/g, '');
                                tmp = tmp.replace(/<\/div>/g, '');
                                tmp = tmp.replace(/\n/g, '');
                                tmp = tmp.replace(/<br[\s]*\/>/g, '');
                                while(tmp.indexOf('  ') >= 0) {
                                    tmp = tmp.replace('  ', '');
                                }
                                if(tmp && tmp != '') {
                                    content += tmp;
                                }
                            }
                        }
                        index[text] = {
                            content: content,
                            path: path
                        };
                    }
                });
            });
        });
    });
}

function find(searchString) {
    var results = [];
    for(var i in index) {
        var position = index[i].content.toLowerCase().indexOf(searchString.toLowerCase());
        if(position >= 0) {
            results.push({
                name: i,
                position: position
            });
        }
    }
    return results;
}

function showSearchResults(searchString, results) {
    var html = '';
    for(var i in results) {
        var text = filterResult(searchString, index[results[i].name].content, results[i].position);
        html += '<h3>' + results[i].name + '</h3>';
        html += '<p class="text">';
        html += text;
        html += '</p>';
        html += '<span class="navlink" onclick="loadArticle(\'' + index[results[i].name].path + '\');">&rarr; goto</span>';
    }
    $('#searchResults').html(html);
}

function filterResult(searchString, result, position) {
    var start = position - 200 >= 0 ? position - 200 : 0;
    var end = position + searchString.length + (start === 0 ? 400 : 200) >= result.length ? result.length : position + searchString.length + (start === 0 ? 400 : 200);
    start = end === result.length ? (position - 400 >= 0 ? position - 400 : 0) : start;
    //result = result.replace(new RegExp('(' + searchString +')', 'gi'), '<span class="highlight">' + RegExp.$1 + '</span>');
    var str = result.substring(start, end);
    result = '';
    while(str.toLowerCase().indexOf(searchString.toLowerCase()) >= 0) {
        result += str.substring(0, str.toLowerCase().indexOf(searchString.toLowerCase())) + '<span class="highlight">' + str.substring(str.toLowerCase().indexOf(searchString.toLowerCase()), str.toLowerCase().indexOf(searchString.toLowerCase()) + searchString.length) + '</span>';
        str = str.substring(str.toLowerCase().indexOf(searchString.toLowerCase()) + searchString.length);
    }
    //console.log(str);
    result += str;
    return (start > 0 ? '... ' : '') + result + (end < result.length ? ' ...' : '');
}

$('document').ready(function() {
    registerArticles();

    // load home as first page to enter
    loadArticle('home');

    // generate the index
    generateIndex();

    $(window).bind('hashchange', function() {
        if(forcedHashChange) {
            forcedHashChange = false;
            return;
        }

        loadArticle(window.location.hash.substring(1), false, true);
    });

    // bind changes in filter field to filter funtion
    $("input[id='filterField']").keyup(function() {
        filter($(this).val());
    });
    
    /**
    * init for rating system
    */
    $('.star').hover(
		/* mouse in */
		function () {
			clearAll();
			var starNumber = getStarNumber($(this));
			for(var i = 0; i <= starNumber; i++) {
				$('#star' + i).removeClass('star-off');	
				$('#star' + i).addClass('star-on');	
			}
		},
		/* mouse out */
		function () {
			var starNumber = getStarNumber($(this));
			for(var i = 0; i <= starNumber; i++) {
				$('#star' + i).removeClass('star-on');	
				$('#star' + i).addClass('star-off');	
			}
		}
	);
	
	$('.star').click(function() {
		var starNumber = getStarNumber($(this));
		for(var i = 0; i <= starNumber; i++) {
			$('#star' + i).removeClass('star-off');	
			$('#star' + i).addClass('star-on');	
		}
		$('#starsClicked').attr('value', starNumber);
	});
	
	$('#stars').mouseleave(function() {
		for(var i = 0; i <= parseInt($('#starsClicked').attr('value')); i++) {
			$('#star' + i).removeClass('star-off');	
			$('#star' + i).addClass('star-on');	
		}
	});
	
	$('#btn').click(function() {
		var numberStars = $('.star-on').length;
		alert(guid() + ': ' + numberStars);	
	});
	
	$('#sp').click(function() {
		$('#feedback').toggle();
	});
});


/**
* JS for rating system
*/
function buildRating() {
	var ratingStr = '<div id="rating">'
		+ '<div id="stars">'
		+ '<input type="hidden" value="0" id="starsClicked" />'
		+ '<input type="hidden" value="" id="pageRated" />'
		+ '<div class="star star-off" id="star1"></div>'
		+ '<div class="star star-off" id="star2"></div>'
		+ '<div class="star star-off" id="star3"></div>'
		+ '<div class="star star-off" id="star4"></div>'
		+ '<div class="star star-off" id="star5"></div>'
		+ '</div>'
		+ '<input type="button" value="send" id="btn" />'
		+ '<img src="css/ajax-loader.gif" style="display:none;" />'
		+ '</div>';
	
	$('#container').append(ratingStr);
}

function getStarNumber(el) {
	return parseInt(el.attr('id').charAt(4));
}

function clearAll() {
	$('.star').removeClass('star-on');	
	$('.star').addClass('star-off');							
}

function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function sendRequest(obj) {
	$.ajax({
		url: 'http://fiddle.jshell.net/favicon.png',
		beforeSend: function( xhr ) {
			xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
		},
		success: function( data ) {
	    	if (console && console.log){
				console.log( 'Sample of data:', data.slice(0,100) );
			}
	  	}
	});	
}



