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

function loadArticle(path, firstTry, isBack) {
    if (path === '404' && !firstTry) {
        return;
    }

    $.ajax({
        url: 'content/' + path + '.html',
        success: function(data) {
            $('#container').html(data);
            scroll('top', true);
            $.syntax({
                blockLayout: "plain"
            });

            if(!isBack) {
                window.location.hash = path;
                forcedHashChange = true;
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

function generateIndex() {
    $.ajax({
        url: 'index_builder/generator.php',
        success: function(data) {
            console.log(data);
        },
        error: function(xhr, error) {
            alert(error);
        }
    });
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