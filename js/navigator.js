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
                        index[text] = data.replace(/(<.*?>)/ig, '');
                        index[text] = index[text].replace(/(<!--.*?-->)/ig, '');
                    }
                });
            });
        });
    });
}

function find(searchString) {
    var results = [];
    for(var i in index) {
        var position = index[i].toLowerCase().indexOf(searchString.toLowerCase());
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
        var text = filterResult(searchString, results[i].name);
        html += '<h3>' + results[i].name + '</h3>';
        html += '<p class="text">';
        html += text;
        html += '</p>';
        html += '<span class="navlink" onclick="scroll(\'top\')">&rarr; goto</span>';
    }
    $('#searchResults').html(html);


    /*
        <h3>M.LabelView</h3>
    <p class="text">
        ... of the basic views of the UI library of The-M-Project. Though it is not rendered ...
    </p>
    <span class="navlink" onclick="scroll('top')">&rarr; goto</span>

    <h3>M.ButtonView</h3>
    <p class="text">
        ... clickable area, that <span class="highlight">displays</span> a text value and mostly ...
    </p>
    <span class="navlink" onclick="scroll('top')">&rarr; goto</span>
     */
}

function filterResult(searchString, result) {
    console.log(result);
    return searchString;
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