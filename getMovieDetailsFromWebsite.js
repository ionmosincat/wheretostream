/**
 * Get movie name, genre and year from the movie's website
 * Supported website: imdb, rottentomatoes, metacritic, letterboxd
 */
(function getMovieDetailsFromWebsite() {
  const URL = window.location.href;

  let title = "";
  let genre = "";
  let year = "";
  let allowedSite = false;

  // metacritic.com
  if (URL.indexOf("metacritic.com") > -1) {
    let urlParts = URL.substring(
      URL.indexOf("metacritic.com"),
      URL.length
    ).split("/");

    let title = null;
    if (urlParts && urlParts.length > 1) {
      let tempTitle = urlParts[2];
      if (tempTitle) {
        tempTitle = tempTitle.replaceAll("-", " ");
        title = tempTitle.replace(/(^\w{1})|(\s{1}\w{1})/g, (match) =>
          match.toUpperCase()
        );
      }
    }

    genre = urlParts[1];
    year = document.querySelector(".release_year");
    year = year == null ? "" : year.innerText;
    allowedSite = true;
    return { title, genre, year };
  }

  // rottentomatoes.com
  if (URL.indexOf("rottentomatoes.com") > -1) {
    let urlParts = URL.substring(
      URL.indexOf("rottentomatoes.com"),
      URL.length
    ).split("/");
    genre = urlParts[1];
    if (genre === "m") {
      genre = "movie";
    }

    // treat the case when on a page of a series's season
    if (urlParts.length > 3 && urlParts[3].includes("s")) {
      title = document.querySelector(".mop-ratings-wrap__title--small");
    } else {
      title = document.querySelector(".mop-ratings-wrap__title--top");
      if (title == null) {
        title = document.querySelector(".scoreboard__title");
      }
    }

    title = title == null ? "" : title.innerText;

    year = null;
    allowedSite = true;

    return { title, genre, year };
  }

  // imdb.com
  if (URL.indexOf("imdb.com") > -1) {
    if (document.querySelector('script[type="application/ld+json"]')) {
      const jsonld = JSON.parse(document.querySelector('script[type="application/ld+json"]').innerText);
      const fullTitle = document.querySelector("meta[property='og:title']").getAttribute('content');
      const yearPattern = /\(([\d]{4})\)/;
  
      title = jsonld.name;
      genre = jsonld['@type'] == 'Movie' ? 'movie' : 'tv';
      year = fullTitle.match(yearPattern) ? yearPattern.exec(fullTitle)[1] : null;
      allowedSite = true;
  
      return { title, genre, year };
  
    }
  }

  // letterboxd.com
  if (URL.indexOf("letterboxd.com") > -1) {
    title = document.querySelector("#featured-film-header > h1");
    title = title == null ? "" : title.innerText;
    year = null;
    genre = "movie";
    allowedSite = true;

    return { title, genre, year };
  }

  // cinemagia.ro
  if (URL.indexOf("cinemagia.ro/filme/") > -1) {
    const jsonld = JSON.parse(document.querySelector('script[type="application/ld+json"]').innerText);
    const fullTitle = document.querySelector("meta[property='og:title']").getAttribute('content');
    const yearPattern = /\(([\d]{4})\)/;

    title = jsonld.name;
    genre = jsonld['@type'] == 'Movie' ? 'movie' : 'tv';
    year = fullTitle.match(yearPattern) ? yearPattern.exec(fullTitle)[1] : null;   

    return { title, genre, year };
  }

  // MyAnimeList
  if (URL.indexOf("myanimelist.net") > -1) {
    title = document.querySelector(".title-name");
    title = title == null ? "" : title.innerText;
    year = null;
    genre = "tv";
    allowedSite = true;

    return { title, genre, year };
  }

  return { title, genre, year };
})();
