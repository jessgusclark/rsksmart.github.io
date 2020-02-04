$(document).ready(function () {
  setUpQuickSearch();
  setUpMainSearch();
});
// add active class to a in inner nav based on url
$(function () {
  var pageUrl = location.href;
  $('a').each(function () {
    $(this).toggleClass('active', this.href === pageUrl);
	});
});

$(document).ready(function () {
  $('ul li:has(ul)', '.menu-container').addClass('subnav');
  $('.desktop_accordion .subnav > a').click(function (event) {
    event.preventDefault();
    $(this).parent().toggleClass('rotate-chevron');
    $(this).next('ul').toggleClass('subnav-reveal');
  });
});

$('a[href^="#"]').on('click', function (event) {
  var target = $(this.getAttribute('href'));
  if (target.length) {
    event.preventDefault();
    $('html, body').stop().animate({
      scrollTop: target.offset().top - 100
    }, 1000);
  }
});

$(document).ready(function () {
  // set all links within the collapsible menu to not have `current`,
  // except for the one link that points to the current page
  var pageUrl = location.href;
  $('.desktop_accordion ul li a').each(function () {
    $(this).toggleClass('current', this.href === pageUrl);
  });

  // traverse up the list of parents until we get to the top,
  // building up the links to them along the way for use as breadcrumbs,
  // plus setting them to `current` as well, so that they appear expanded
  var crumbs = $('.current').parentsUntil('.exclude-doc-from-breadcrumbs')
    .prev('a').add('.current')
    .map(function () {
      var link = $(this).attr('href');
      var link_text = $(this).text();
      var title = $(this).attr('title');
      var bc = '<li><a href='+link+' title='+''+'>'+link_text+'</a></li>';
      return bc;
    }).get().join('  ');
  $('.breadcrumb').html(crumbs);
});

$(document).ready(function () {
  var liText = '', liList = $('.breadcrumb li'), listForRemove = [];
  $(liList).each(function () {
    var text = $(this).text();
    if (liText.indexOf('|'+ text + '|') == -1) {
      liText += '|'+ text + '|';
    } else {
      listForRemove.push($(this));
    }
  });
  $(listForRemove).each(function () { $(this).remove(); });
});

$(document).ready(function () {
 $('.current').parentsUntil('.first_level').addClass('subnav-reveal rotate-chevron');
 $('.current').parents().addClass('rotate-chevron current');
 $('.toggle-nav-column-visibility').on('click', toggleNavColumnVisibility);
});

// Header scroll class
$(window).scroll(function () {
  if ($(this).scrollTop() > 10) {
    $('.navbar').addClass('header-scrolled');
    $('.logo').addClass('header-scrolled');
    $('.navbar-toggler-icon').addClass('header-scrolled');
    $('.navbar_bottom_shape').addClass('header-scrolled');
  } else {
    $('.navbar').removeClass('header-scrolled');
    $('.logo').removeClass('header-scrolled');
    $('.navbar-toggler-icon').removeClass('header-scrolled');
    $('.navbar_bottom_shape').removeClass('header-scrolled');
  }
});

function ChangeTheme (e) {
  if ($(e).text() === 'Dark') {
    $(e).text('Light');
    $('link[href="/assets/css/styles_dark.css"]').prop('disabled', false);
  } else {
    $(e).text('Dark');
    $('link[href="/assets/css/styles_dark.css"]').prop('disabled', true);
  }
  return false;
}

// toggle between expand all and collapse all
function toggleNavColumnVisibility (e) {
  // work out whether we are expanding or collapsing
  var target = $(this);
  target.toggleClass('collapsed');
  var isCollapsed = target.hasClass('collapsed');
  var targetText = isCollapsed ? 'Expand All' : 'Collapse All';

  // update the text we just clicked on
  target.find('.text').text(targetText);
  target.toggleClass('rotate-chevron', !isCollapsed);

  // update every item in the collapsible menu
  $('.desktop_accordion .subnav > a').each(function () {
    $(this).parent().toggleClass('rotate-chevron', !isCollapsed);
    $(this).next('ul').toggleClass('subnav-reveal', !isCollapsed);
  });

  return false;
}

// search
function setUpQuickSearch () {
  // quick search is available on all pages
  $('form#quick-search input#from').val(window.location.pathname);
}

function setUpMainSearch () {
  if (document.location.pathname.indexOf('/search/') !== 0) {
    // only relevant on the search page
    return;
  }
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('results-container');
  const searchResultTemplate = `<div class="container"><br/><div class="row"><a href="{url}"><h1>{title}</h1></a></div>{desc}<br/>{tags}</div>`
  //const searchResultTemplate = '<a href="{url}" title="{desc}">  <h2 class="archive__item-title" itemprop="headline">{title}<\/h2>  <p class="archive__item-excerpt" itemprop="description">{desc}<\/p><\/a>'
  

  $.getJSON('/search/search.json', function (searchJson) {
    // defer initialisation of search feature until *after*
    // we have loaded the search JSON manually,
    // because search feature does not provide event or callback
    // to signal completion of asynchronous load of data
    const search = SimpleJekyllSearch({
      searchInput,
      resultsContainer,
      json: searchJson,
      searchResultTemplate,
      limit: 10,
      fuzzy: false,
      templateMiddleware: (prop, text, template) => {
        if (prop == 'desc') {
          const truncate = (str, no_words) => str.split(" ").splice(0,no_words).join(" ");
          const searchInputValue = searchInput.value.toLowerCase();
          const regexp = new RegExp('.(' + searchInputValue + ')\\b.*.', 'ig');
          const decodedText = decodeURIComponent(text);
          
          const result = [...decodedText.matchAll(regexp)];
          
          if(!result || result.length < 1)
             return ""
          
          const resultString = truncate(result[0][0], 20); //only show the first result
          const otherResults = `<div class="row pt-0 pl-3" style="font-style: italic;">Other results found</div>`;
          const parsedResult = `<div class="row"><div class="col p-0">${result[0].length == 1 ? resultString : resultString + otherResults}</div></div>`
          
          console.log(parsedResult)

          return parsedResult;
        } else if(prop == 'tags') {
          const tags = text.split(', ');
          const badges = tags.map(tag => `<a href="${`?q=${tag}&from=%2Fsearch%2F`}"><span class="badge badge-secondary p-1">${tag}</span><a/>`);
          const parsedTags = `<div class="row">${badges.reduce((a,b) => a + b)}<div>`

          return parsedTags
        }
      }
    });
    try {
      // if quick search has been used, use query parameters in URL to
      // perform search immediately
      const queryParams = (new URL(document.location)).searchParams;
      const q = queryParams.get('q');
      if (typeof q !== 'undefined') {
        searchInput.value = q;
        setTimeout(function () {
          search.search(q);
        }, 0);
      }
    } catch (ex) {
      // do nothing
    }
  });
}
