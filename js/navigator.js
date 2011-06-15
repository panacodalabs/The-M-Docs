var forcedHashChange = false;

function registerArticles() {
    $('.nav li h3').each(function() {
        var category = $(this).text().toLocaleLowerCase().replace(/[\.\s\?-]+/g, '_');
        $(this).bind('click', function(evt) {
            collapseCategory($(this).siblings('ul .subnav'));
        });
        $(this).siblings('ul .subnav').each(function() {
            $(this).find('li').each(function() {
                var path = category + '/' + $(this).text().toLocaleLowerCase().replace(/[\.\s\?-]+/g, '_');
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
            if(searchString) {
                var results = find(searchString);
                data = data.replace(/<%= searchString %>/g, searchString);
                data = data.replace(/<%= numResults %>/g, results.length);
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
            showSearchResults(searchString, results);
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

function generateIndex() {
    /* register keyup event to search bar */
    $('#search').bind('keyup', function(evt) {
        if(evt.keyCode === 13) {
            loadArticle('search', false, false, $('#search').val());
        }
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
                        var path = category + '/' + $(this).text().toLocaleLowerCase().replace(/[\.\s\?-]+/g, '_');
                        if(regexResult) {
                            for (var i = 0; i < regexResult.length; ++i) {
                                var tmp = regexResult[i].replace(/<[^>]*>([\S\s]+)<\/[^>]*>/g, RegExp.$1);
                                tmp = tmp.replace(/<span[A-Za-z\s0-9="\/\(\)'_;]*>/g, '');
                                tmp = tmp.replace(/<p[A-Za-z\s0-9="\/\(\)'_;]*>/g, '');
                                tmp = tmp.replace(/<\/span>/g, '');
                                tmp = tmp.replace(/<\/p>/g, '');
                                tmp = tmp.replace(/<\/pre>/g, '');
                                content += tmp;
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
        html += '<span class="navlink" onclick="loadArticle(\'' + index[results[i].name].content + '\');">&rarr; goto</span>';
    }
    $('#searchResults').html(html);
}

function filterResult(searchString, result, position) {
    var start = position - 200 >= 0 ? position - 200 : 0;
    var end = position + searchString.length + (start === 0 ? 400 : 200) >= result.length ? result.length : position + searchString.length + (start === 0 ? 400 : 200);
    start = end === result.length ? (position - 400 >= 0 ? position - 400 : 0) : start;
    result = (start > 0 ? '... ' : '') + result.substring(start, end) + (end < result.length ? ' ...' : '');
    result = result.replace(new RegExp('(' + searchString +')', 'gi'), '<span class="highlight">' + searchString + '</span>');
    return result;
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
});