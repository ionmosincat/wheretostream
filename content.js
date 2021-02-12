let selectedStreamServices = [];
let selectedCountry = null;
let selectedCountryFlagIcon = null;
let selectedPopupNotification = null;
let selectedRentBuy = null;
let selectedSimilar = null;

const API_KEY = "";
const API_KEY_GEOLOCATION = "";
const FLAG_ICON_BASE_URL = "https://flagcdn.com/";

/**
 * SETTINGS, INITS, LISTENERS
 */

/**
 * Whenever a webpage is loaded, show the extension badge
 */
window.onload = function () {
  showBadge();
};

/**
 * Add event listenters to elements on DOM content load
 */
document.addEventListener(
  "DOMContentLoaded",
  function () {
    const resultsButton = document.querySelector("#resultsButton");
    const settingsButton = document.querySelector("#settingsButton");
    const closeButton = document.querySelector("#closeButton");
    const saveSettingsButton = document.querySelector("#saveSettingsButton");
    const infoMessage = document.querySelector("#infoMessage");
    const resultsDiv = document.querySelector("#resultsDiv");

    if (!triggerSearch()) {
      return;
    }

    resultsButton.addEventListener(
      "click",
      function () {
        openTab(event, "resultsTab");
      },
      false
    );

    settingsButton.addEventListener(
      "click",
      function () {
        openTab(event, "settingsTab");
      },
      false
    );

    closeButton.addEventListener(
      "mouseover",
      function () {
        closeButton.style.opacity = "0.9";
      },
      false
    );

    closeButton.addEventListener(
      "mouseout",
      function () {
        closeButton.style.opacity = "0.6";
      },
      false
    );

    closeButton.addEventListener(
      "click",
      function () {
        window.close();
      },
      false
    );

    saveSettingsButton.addEventListener(
      "click",
      function () {
        saveSettings();
      },
      false
    );

    saveSettingsButton.addEventListener(
      "mouseout",
      function () {
        let infoTexts = document.querySelectorAll(".info-text");
        infoTexts.forEach((infoText) => {
          infoText.classList.remove("alert-border");
        });
      },
      false
    );

    document
      .querySelector(".coffee-text")
      .addEventListener("mouseover", function () {
        document
          .querySelector(".slide-in-content")
          .setAttribute("style", "transition: transform .5s ease;");
        document.querySelector(".slide-in").classList.toggle("show");
      });

    document
      .querySelector(".coffee-text")
      .addEventListener("mouseout", function () {
        document.querySelector(".slide-in").classList.toggle("show");
      });
  },
  false
);
/* -------------------------------------------------------------------- */

/**
 * FUNCTIONALITY
 */

/**
 * Get user preferences/settings from chrome storage (country, streaming services, popup, similar, rent-buy options)
 */
async function getUserPreferences() {
  // chrome.storage.sync.clear();
  let p = new Promise(function (resolve, reject) {
    chrome.storage.sync.get(
      ["country", "country_flag", "services", "popup", "rent_buy", "similar"],
      function (options) {
        resolve([
          options.country,
          options.services,
          options.country_flag,
          options.popup,
          options.rent_buy,
          options.similar,
        ]);
      }
    );
  });

  const preferences = await p;
  return preferences;
}

/**
 * Save settings in chrome storage (country, streaming services, popup, similar, rent-buy options)
 */
function setUserPreferences() {
  let userSettings = {
    country: selectedCountry,
    country_flag: selectedCountryFlagIcon,
    services: selectedStreamServices,
    popup: selectedPopupNotification,
    rent_buy: selectedRentBuy,
    similar: selectedSimilar,
  };
  chrome.storage.sync.set(userSettings, function () {});
}

/**
 * Functionality for tabbed menu (Results and Settings)
 * @param {*} evt
 * @param {*} tabName
 */
async function openTab(evt, tabName) {
  // Declare all variables
  let i, tabcontent, tablinks;

  // Get all elements with class = "tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class = "tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  // Create settings page
  // - countries (read from json and create countries list on first visit)
  // - streaming services
  // - select corresponding checkboxes
  if (tabName === "settingsTab") {
    if (!document.querySelector(".custom-options").hasChildNodes()) {
      createCountriesList();
      if (!document.querySelector("#streamingData").hasChildNodes()) {
        createStreamingList();
      }
      if (selectedPopupNotification) {
        document.querySelector(
          "#notificationPopupInput"
        ).checked = selectedPopupNotification;
      }

      if (selectedRentBuy) {
        document.querySelector("#rentBuyInput").checked = selectedRentBuy;
      }

      if (selectedSimilar) {
        document.querySelector("#similarInput").checked = selectedSimilar;
      }
    } else {
      [
        selectedCountry,
        selectedStreamServices,
        selectedCountryFlagIcon,
        selectedPopupNotification,
        selectedRentBuy,
        selectedSimilar,
      ] = await getUserPreferences();
    }
  }
}

/**
 * Trigger the search (when the popup is open)
 */
async function triggerSearch() {
  [
    selectedCountry,
    selectedStreamServices,
    selectedCountryFlagIcon,
    selectedPopupNotification,
    selectedRentBuy,
    selectedSimilar,
  ] = await getUserPreferences();

  if (typeof infoMessage == "undefined") {
    return false;
  }

  if (!selectedCountry) {
    // hide results tab on first visit, when settings need to be set
    resultsButton.setAttribute("style", "display: none");
    settingsButton.click();
  } else {
    resultsButton.setAttribute("style", "display: block");
    // fetch movie details from website using IIFE js file
    // the function getMovieDetailsFromWebsite() returns undefined for unsupported websites (to be checked why)
    chrome.tabs.executeScript(
      { file: "./getMovieDetailsFromWebsite.js" },
      function (result) {
        // if the title element doesn't exist in the page, either not supported website or not on a movie's page
        if (result == null || result[0] == null || result[0].title == "") {
          infoMessage.innerHTML =
            "This website is not supported. <br>Please try the extension on one of the following:";
          infoMessage.innerHTML += document.querySelector(
            "#allowedwebsites"
          ).innerHTML;
          infoMessage.innerHTML +=
            "If you already are on one of these websites, please refresh the page or go to a movie's page.";
        } else {
          // there is a title on the page
          let { title, genre, year } = result[0];
          resultsDiv.innerHTML = "";

          // show current selected country - flag bottom right
          document
            .querySelector(".current-country-image")
            .setAttribute("src", selectedCountryFlagIcon);

          getMovie(title, genre, year).then((movie) => {
            if (movie && movie.results && movie.results.length > 0) {
              let movieId = movie.results[0].id;

              // get streaming and display results
              getStreaming(movieId, genre).then((stream) => {
                let results = stream.results[selectedCountry];
                if (results && results.flatrate) {
                  resultsStream = results.flatrate;
                  resultsDiv.innerHTML = "";

                  let exactResults = [];
                  let exactResultsLogo = [];
                  let alternativeStreaming = [];
                  let alternativeStreamingLogo = [];
                  let resultsCount = 0;

                  // check if results match the preffered streaming services
                  resultsStream.forEach((element) => {
                    let provider =
                      element.provider_name == "Amazon Prime Video"
                        ? "Prime Video"
                        : element.provider_name;
                    let showAllProviders =
                      selectedStreamServices &&
                      selectedStreamServices.length > 0 &&
                      selectedStreamServices[0] ==
                        "Show me all available streaming options";
                    if (
                      selectedStreamServices.includes(provider) ||
                      showAllProviders
                    ) {
                      resultsCount++;
                      exactResults.push(element.provider_name);
                      exactResultsLogo.push(element.logo_path);
                    } else {
                      alternativeStreaming.push(element.provider_name);
                      alternativeStreamingLogo.push(element.logo_path);
                    }
                  });

                  let streamWrapper = createCustomElement(
                    "div",
                    "rent-div-wrapper"
                  );
                  let streamContainer = createCustomElement("div", "rent-div");
                  let streamText = createCustomElement("span", "yellow-1");
                  let streamTextContainer = createCustomElement(
                    "div",
                    "rent-text-container"
                  );

                  streamTextContainer.appendChild(streamText);
                  streamWrapper.appendChild(streamTextContainer);
                  streamWrapper.appendChild(streamContainer);
                  resultsDiv.appendChild(streamWrapper);

                  // results found match the preferred selected streaming services
                  if (resultsCount > 0) {
                    infoMessage.innerText = "Available streaming options:";
                    infoMessage.style.display = "block";
                    streamText.innerText = "STREAM";

                    for (let i = 0; i < exactResults.length; i++) {
                      displayResults(
                        exactResults[i],
                        exactResultsLogo[i],
                        streamContainer
                      );
                    }
                  } else {
                    // showing alternative streaming services
                    infoMessage.innerText =
                      "Not available. But you can watch it here:";
                    streamText.innerText = "STREAM";
                    for (let i = 0; i < alternativeStreaming.length; i++) {
                      displayResults(
                        alternativeStreaming[i],
                        alternativeStreamingLogo[i],
                        streamContainer
                      );
                    }
                  }
                } else {
                  /**
                   * no stream found; look for similar movies that can be streamed if <Show similar> settings are checked
                   */
                  resultsDiv.innerHTML = "";
                  infoMessage.innerHTML =
                    "Unfortunately, no streaming options were found in your country for";
                  let titleSpan = createCustomElement("span", "title");
                  titleSpan.innerText = " " + title.trim() + ".";
                  infoMessage.appendChild(titleSpan);

                  if (selectedSimilar) {
                    findSimilarMovies(movieId, genre);
                  }
                }

                // check if <Show Rent & Buy options> is selected
                if (
                  selectedRentBuy &&
                  results &&
                  (results.rent || results.buy)
                ) {
                  showRentBuyOptions(results.rent, "RENT");
                  showRentBuyOptions(results.buy, "BUY");
                } else {
                  if (infoMessage && (!results || !results.flatrate)) {
                    infoMessage.style.display = "block";
                  }

                  // hide the "stream" info text if no rent or buy options
                  if (document.querySelector(".yellow-1")) {
                    document.querySelector(".yellow-1").style.display = "none";
                  }
                }
              });
            } else {
              // the movie was not found
              resultsDiv.innerHTML = "";
              infoMessage.innerHTML =
                "Unfortunately, this movie was not found. Please try with another one.";
            }
          });
        }

        // show results tab once the search is done
        resultsButton.click();

        // show me a coffee button
        showBuyMeACoffee(100);
      }
    );
  }
  return true;
}

/**
 * Search similar movies that are streamable on the preffered streaming services
 * @param {*} movieId - movie ID got from TMDB API - getMovie
 * @param {*} genre   - movie type - series (tv) or movie
 */
async function findSimilarMovies(movieId, genre) {
  // create elements
  let similarDivWrapper = createCustomElement("div", "rent-div-wrapper");
  let similarDivContainer = createCustomElement("div", "rent-div");
  let similarText = createCustomElement("span", "yellow-1");
  let similarTextContainer = createCustomElement("div", "rent-text-container");
  let similarDivList = createCustomElement("div", "similar-container");

  // set attributes
  similarText.innerText = "SIMILAR";
  similarDivList.setAttribute("id", "similarDivContent");

  // add to the DOM
  similarTextContainer.appendChild(similarText);
  similarDivWrapper.appendChild(similarTextContainer);
  similarDivWrapper.appendChild(similarDivContainer);
  similarDivContainer.appendChild(similarDivList);

  let similarMovies = [];
  let similarMoviesStreamable = new Set();

  // loop through the first 10 pages of TMDB API similar results (200 movies) or until 5 movies are found - whichever happens first
  let movieCount = 0;
  for (let page = 1; page < 11; page++) {
    if (movieCount >= 5) {
      break;
    }
    let responseMovies = await getSimilarMovies(movieId, genre, page).then(
      (movies) => {
        if (
          movies &&
          movies.results &&
          movies.results.length > 0 &&
          movies.total_pages
        ) {
          movies.results.forEach(async (element) => {
            let movieName = genre === "movie" ? element.title : element.name;
            similarMovies.push(movieName);

            // find streams for each movie to compare against preferred service streams
            let responseStreams = await getStreaming(element.id, genre).then(
              (stream) => {
                let results = stream.results[selectedCountry];
                if (results && results.flatrate) {
                  results = results.flatrate;

                  let similarMoviesStream = [];
                  let similarMoviesStreamLogo = [];

                  results.forEach((stream) => {
                    let provider =
                      stream.provider_name == "Amazon Prime Video"
                        ? "Prime Video"
                        : stream.provider_name;
                    let showAllProviders =
                      selectedStreamServices &&
                      selectedStreamServices.length > 0 &&
                      selectedStreamServices[0] ==
                        "Show me all available streaming options";
                    if (
                      selectedStreamServices.includes(provider) ||
                      showAllProviders
                    ) {
                      // similar movies streaming in the country
                      similarMoviesStream.push(stream.provider_name);
                      similarMoviesStreamLogo.push(stream.logo_path);
                      similarMoviesStreamable.add(movieName);
                    }
                  });

                  // show a maximum of 5 similar movies
                  if (
                    similarMoviesStream.length > 0 &&
                    similarMoviesStreamable.size < 6
                  ) {
                    movieCount++;
                    resultsDiv.appendChild(similarDivWrapper);
                    displaySimilarMovies(
                      movieName,
                      similarMoviesStream,
                      similarMoviesStreamLogo
                    );
                  }
                }
              }
            );
          });
        }
      }
    );
  }
}

/**
 * Display Rent or Buy options
 * @param {*} results     - an array with providers names and logos
 * @param {*} optionType  - RENT or BUY
 */
function showRentBuyOptions(results, optionType) {
  // create elements
  let wrapper = createCustomElement("div", "rent-div-wrapper");
  let container = createCustomElement("div", "rent-div");
  let className = "yellow-" + (optionType === "RENT" ? "2" : "3");
  let text = createCustomElement("span", className);
  let textContainer = createCustomElement("div", "rent-text-container");

  // set attributes
  text.innerText = optionType;

  // add to the DOM
  textContainer.appendChild(text);
  wrapper.appendChild(textContainer);
  wrapper.appendChild(container);

  if (results) {
    let provider = [];
    let providerLogo = [];
    results.forEach((element) => {
      provider.push(element.provider_name);
      providerLogo.push(element.logo_path);
    });
    for (let i = 0; i < provider.length; i++) {
      displayResults(provider[i], providerLogo[i], container);
    }
    resultsDiv.appendChild(wrapper);
  }
}

/**
 * Trigger search and display the corresponding badge (only on supported websites)
 * green  - the movie was found for the selected streaming service and country
 * yellow - the movie was not found for the selected streaming services, but streams exists for the user's country
 * red    - no result found
 */
async function showBadge() {
  [
    selectedCountry,
    selectedStreamServices,
    selectedCountryFlagIcon,
    selectedPopupNotification,
    selectedRentBuy,
    selectedSimilar,
  ] = await getUserPreferences();

  let { title, genre, year } = getMovieDetailsFromWebsite();

  if (selectedCountry) {
    if (title) {
      getMovie(title, genre, year).then((movie) => {
        if (movie && movie.results && movie.results.length > 0) {
          let movieId = movie.results[0].id;
          getStreaming(movieId, genre).then((stream) => {
            let results = stream.results[selectedCountry];
            // if streaming option found
            if (results && results.flatrate) {
              resultsStream = results.flatrate;
              handleResults(resultsStream);
            } else {
              // no streaming found - show red badge
              chrome.runtime.sendMessage({ result: "2" });

              // show popup notification if settings checked
              if (selectedPopupNotification) {
                showPopupNotification([], [], 2);
              }
            }
          });
        }
      });
    }
  }
}

/**
 * Handle results for the showBadge case (on page load, the extension is not open)
 * Query results to be displayed in the notification popup
 * Color the icon badge based on case (found, found alternative streams, not found)
 * @param {*} results - array of objects (from TMDB API) with streaming options
 */
function handleResults(results) {
  let exactResults = [];
  let exactResultsLogo = [];
  let alternativeStreaming = [];
  let alternativeStreamingLogo = [];
  let resultsCount = 0;

  // check which results to be shown (based on selected preferred providers)
  results.forEach((element) => {
    let provider =
      element.provider_name == "Amazon Prime Video"
        ? "Prime Video"
        : element.provider_name;
    let showAllProviders =
      selectedStreamServices.length > 0 &&
      selectedStreamServices[0] == "Show me all available streaming options";
    if (selectedStreamServices.includes(provider) || showAllProviders) {
      resultsCount++;
      exactResults.push(element.provider_name);
      exactResultsLogo.push(element.logo_path);
    } else {
      alternativeStreaming.push(element.provider_name);
      alternativeStreamingLogo.push(element.logo_path);
    }
  });

  if (resultsCount > 0) {
    // found results
    chrome.runtime.sendMessage({ result: "0" });
    if (selectedPopupNotification) {
      showPopupNotification(exactResults, exactResultsLogo, 0);
    }
  } else {
    // display alternative results
    chrome.runtime.sendMessage({ result: "1" });
    if (selectedPopupNotification) {
      showPopupNotification(alternativeStreaming, alternativeStreamingLogo, 1);
    }
  }
  return results;
}

/**
 * Handle click event on each streaming service (check current service, uncheck others, etc)
 * Save selected stream services to global selectedStreamServices variable
 * Selecting the first option ("Show all available services") should uncheck all other options;
 * respectively, selecting any other option should uncheck the first option
 */
function saveStreamService() {
  if (!selectedStreamServices) {
    selectedStreamServices = [];
  }

  let div = document.querySelector(`#${this.id}`);
  div.classList.toggle("stream-wrapper-selected");

  // stream-wrapper0 - first div (Show all available streaming options)
  if (this.id !== "stream-wrapper0") {
    let div0 = document.querySelector("#stream-wrapper0");
    div0.classList.remove("stream-wrapper-selected");
    div0.setAttribute("data-checked", "0");
    document
      .querySelector(`#stream-wrapper0 > span > img`)
      .setAttribute("src", "images/plus.svg");
    document
      .querySelector(`#${this.id} > span > img`)
      .setAttribute(
        "src",
        div0.dataset.checked == "0" ? "images/plus.svg" : "images/check.svg"
      );
    selectedStreamServices = selectedStreamServices.filter(
      (item) => item != "Show me all available streaming options"
    );
  } else {
    let nodes = document.querySelectorAll("#streamingDiv > a");
    selectedStreamServices = [];
    nodes.forEach((element) => {
      if (element.id != this.id) {
        element.classList.remove("stream-wrapper-selected");
        element.setAttribute("data-checked", "0");
        document
          .querySelector(`#${element.id} > span > img`)
          .setAttribute(
            "src",
            element.dataset.checked === "0"
              ? "images/plus.svg"
              : "images/check.svg"
          );
      }
    });
  }

  let streamService = document.querySelector(
    `#${this.id} > .stream-text > span`
  ).innerText;

  if (div.dataset.checked === "0") {
    div.setAttribute("data-checked", "1");
    selectedStreamServices.push(streamService);
  } else {
    div.setAttribute("data-checked", "0");
    selectedStreamServices = selectedStreamServices.filter(
      (item) => item != streamService
    );
  }

  let plus = document.querySelector(`#${this.id} > span > img`);
  plus.setAttribute(
    "src",
    div.dataset.checked === "0" ? "images/plus.svg" : "images/check.svg"
  );
}

/**
 * Save settings and trigger the search
 */
function saveSettings() {
  selectedPopupNotification = document.querySelector("#notificationPopupInput")
    .checked;
  selectedRentBuy = document.querySelector("#rentBuyInput").checked;
  selectedSimilar = document.querySelector("#similarInput").checked;

  if (
    selectedCountry &&
    selectedStreamServices &&
    selectedStreamServices.length > 0
  ) {
    setUserPreferences();
    triggerSearch();
  } else {
    // show alerts if not all mandatory field were selected
    let infoTexts = document.querySelectorAll(".info-text");
    if (!selectedCountry) {
      infoTexts[0].classList.add("alert-border");
    }
    if (!selectedStreamServices || selectedStreamServices.length == 0) {
      infoTexts[1].classList.add("alert-border");
    }
  }
}

/**
 * Merge createElement() + setAttribute(class)
 * @param {*} elementType - div, span, p, img, etc
 * @param {*} elementClass - class name
 */
function createCustomElement(elementType, elementClass) {
  let element = document.createElement(elementType);
  element.setAttribute("class", elementClass);
  return element;
}

/* -------------------------------------------------------------------- */

/**
 * DISPLAY & SHOW
 */

/**
 * Show ButMeACoffee button
 * @param {*} percentage - % of cases to be shown (100% - show all the time)
 */
function showBuyMeACoffee(percentage) {
  let randomizer = Math.round(Math.random() * 100);
  if (randomizer < percentage) {
    document.querySelector(".coffee-text").style.display = "flex";
  } else {
    document.querySelector(".coffee-text").style.display = "none";
  }
}

/**
 *  Create the streaming results list (provider logo + tooltip with the name) and display it
 * @param {*} providerName
 * @param {*} providerLogoPath
 */
function displayResults(
  providerName,
  providerLogoPath,
  placeHolder = document.getElementById("resultsDiv")
) {
  // create elements
  let result = createCustomElement("div", "result");
  let providerLogo = createCustomElement("div", "provider-logo");
  let logo = document.createElement("img");
  let providerText = createCustomElement("span", "tooltip");

  // set attributes
  logo.setAttribute(
    "src",
    "https://www.themoviedb.org/t/p/original/" + providerLogoPath
  );
  providerText.innerText = providerName;

  // add to DOM
  providerLogo.appendChild(logo);
  providerLogo.appendChild(providerText);
  result.appendChild(providerLogo);
  placeHolder.appendChild(result);
}

/**
 * Show movies with streaming service (logo) for similar movies option
 * @param {*} movie       - movie name
 * @param {*} streams     - array with streaming options for movie
 * @param {*} streamsLogo - array with logos for streaming services
 */
function displaySimilarMovies(movie, streams, streamsLogo) {
  let container = createCustomElement("div", "container-similar");
  let movieName = createCustomElement("p", "info-text-similar");
  movieName.innerText = movie;

  container.appendChild(movieName);

  // show no more than 3 streaming options for one movie - layout restrictions
  let streamsToShow = streamsLogo.length > 3 ? 3 : streamsLogo.length;

  for (let i = 0; i < streamsToShow; i++) {
    // create elements
    let providerLogo = createCustomElement("div", "provider-logo-similar");
    let logo = document.createElement("img");
    let providerText = createCustomElement("span", "tooltip");

    // set attributes
    logo.setAttribute(
      "src",
      "https://www.themoviedb.org/t/p/original/" + streamsLogo[i]
    );
    providerText.innerText = streams[i];

    // add to DOM
    providerLogo.appendChild(logo);
    providerLogo.appendChild(providerText);
    container.appendChild(providerLogo);
  }

  document.getElementById("similarDivContent").appendChild(container);
}

/**
 * Create and show notification popup
 * @param {*} results     - array with provider's name
 * @param {*} resultsLogo - array of logos of streaming providers
 * @param {*} resultType  - 0 - results found for current settings (country & streaming services); 1 - alternative streaming services
 */
function showPopupNotification(results, resultsLogo, resultType) {
  let popupBody = document.querySelector("body");
  let popupContainer = document.createElement("div");
  popupContainer.setAttribute("style", "font-size: 1.3rem;");

  // create notification text
  let info = document.createElement("p");
  info.setAttribute(
    "style",
    "display: block; color: #ddd; line-height: 1.25em;"
  );
  if (resultType === 0) {
    info.innerText = "Watch it here:";
  } else if (resultType === 1) {
    info.innerText = "Watch it here instead:";
  } else {
    info.innerText = `Not available \n 
    Click on the extension icon to see similar titles or options to rent & buy.`;
  }

  // extension logo
  let extensionLogo = document.createElement("img");
  extensionLogo.setAttribute(
    "src",
    chrome.extension.getURL("images/buffer_grey.png")
  );
  extensionLogo.setAttribute("style", "height: 25px;");

  // header - notification text + extension logo
  let header = document.createElement("div");
  header.setAttribute(
    "style",
    "display: flex; justify-content: space-between;"
  );
  header.appendChild(info);
  header.appendChild(extensionLogo);

  popupContainer.appendChild(header);

  // if there are any results, create the results list
  if (resultType !== 2) {
    for (let i = 0; i < results.length; i++) {
      // create elements
      let result = document.createElement("div");
      let providerLogo = document.createElement("div");
      let logo = document.createElement("img");
      let providerText = document.createElement("div");
      let provider = document.createElement("span");

      // set the attributes
      result.setAttribute(
        "style",
        "display: flex; flex-wrap: wrap; align-items: center; margin: 10px 10px 5px 10px;"
      );
      providerLogo.setAttribute(
        "style",
        "display: inline-block; margin: 0 15px 0 0;"
      );
      logo.setAttribute(
        "src",
        "https://www.themoviedb.org/t/p/original/" + resultsLogo[i]
      );
      logo.setAttribute("style", "width: 30px; border-radius: 4px;");
      provider.innerText = results[i];
      provider.setAttribute("style", "display: inline-block;");

      // add to DOM
      providerLogo.appendChild(logo);
      providerText.appendChild(provider);
      result.appendChild(providerLogo);
      result.appendChild(providerText);
      popupContainer.appendChild(result);
    }
  }

  // show popup
  const popupVisibleStyle =
    "font-family: 'Arial'; width: 257px; position: fixed; background-color: rgb(68, 68, 68); top: 0px; z-index: 10000000; right: 0; border-left: 2px solid #FFF; border-bottom: 2px solid #FFF; border-radius: 0 0 0 5px; padding: 10px; color: #eee; font-size: 13px; transition: transform 1s;";
  const popupHiddenStyle = popupVisibleStyle + "transform: translateY(-100%)";

  popupContainer.setAttribute("style", popupHiddenStyle);
  setTimeout(function () {
    popupContainer.setAttribute("style", popupVisibleStyle);
  }, 1000);
  setTimeout(function () {
    popupContainer.setAttribute("style", popupHiddenStyle);
  }, 7500);

  popupBody.appendChild(popupContainer);
}

/**
 * Fancy dropdown for countries
 */
function loadDropdownSettings() {
  document
    .querySelector(".custom-select-wrapper")
    .addEventListener("click", function () {
      this.querySelector(".custom-select").classList.toggle("open");

      if (this.querySelector(".custom-select").classList.contains("open")) {
        document.querySelector(".custom-select-wrapper").style.overflow =
          "visible";
      } else {
        document.querySelector(".custom-select-wrapper").style.overflow =
          "hidden";
      }
    });

  for (const option of document.querySelectorAll(".custom-option")) {
    option.addEventListener("click", function () {
      if (!this.classList.contains("selected")) {
        this.parentNode
          .querySelector(".custom-option.selected")
          .classList.remove("selected");
        this.classList.add("selected");
        this.closest(".custom-select").querySelector(
          ".custom-select__trigger span"
        ).textContent = this.textContent;

        let url = document.querySelector(".selected").dataset.flagIcon;
        selectedCountry = document.querySelector(".selected").dataset
          .countryCode;
        selectedCountryFlagIcon = document.querySelector(".selected").dataset
          .flagIcon;
        this.closest(".custom-select")
          .querySelector(".custom-select__trigger span")
          .setAttribute(
            "style",
            "background-image: url(" +
              url +
              "); background-repeat: no-repeat; background-position: left; background-size: 25px; background-position-x: 5px; padding-left: 40px;"
          );
      }
    });
  }

  window.addEventListener("click", function (e) {
    const select = document.querySelector(".custom-select");
    if (!select.contains(e.target)) {
      document.documentElement.scrollTop = 0;
      select.classList.remove("open");
    }
  });
}

/* -------------------------------------------------------------------- */

/**
 * READ AND USE EXTERNAL DATA (JSON & PARSING WEBSITES)
 */

/**
 * Read countries from json file and create the countries list
 */
async function createCountriesList() {
  chrome.runtime.getPackageDirectoryEntry(function (root) {
    root.getFile("countries.json", {}, function (fileEntry) {
      fileEntry.file(function (file) {
        let reader = new FileReader();
        reader.onloadend = async function (e) {
          let countriesJson = JSON.parse(this.result);
          let container = document.querySelector(".custom-options");

          const countryByIp = await getCountryByIP();

          let isCountrySupported = countriesJson.countries.find(
            (country) => country.countryCode === countryByIp
          );

          if (!selectedCountry && isCountrySupported) {
            selectedCountry = countryByIp;
          }

          countriesJson.countries.forEach((country) => {
            let span = document.createElement("span");
            let flagIconURL =
              FLAG_ICON_BASE_URL + country.countryCode.toLowerCase() + ".svg";

            if (selectedCountry) {
              if (selectedCountry == country.countryCode) {
                span.setAttribute("class", "custom-option selected");
                document.querySelector(
                  ".custom-select__trigger span"
                ).textContent = country.name;

                document
                  .querySelector(".custom-select__trigger span")
                  .setAttribute(
                    "style",
                    "background-image: url(" +
                      flagIconURL +
                      "); background-repeat: no-repeat; background-position: left; background-size: 25px; background-position-x: 5px; padding-left: 40px;"
                  );

                selectedCountryFlagIcon = flagIconURL;
              } else {
                span.setAttribute("class", "custom-option");
              }
            } else if (country.id == "1") {
              span.setAttribute("class", "custom-option selected");
            } else {
              span.setAttribute("class", "custom-option");
            }
            span.setAttribute("data-country-code", country.countryCode);
            span.setAttribute("data-flag-icon", flagIconURL);

            span.setAttribute(
              "style",
              "background-image: url(" +
                flagIconURL +
                "); background-repeat: no-repeat; background-position: left; background-size: 25px; background-position-x: 10px;"
            );

            span.innerText = country.name;

            container.appendChild(span);
          });

          loadDropdownSettings();
        };
        reader.readAsText(file);
      });
    });
  });
}

/**
 * Read streaming services from json file and create the streaming services list
 */
function createStreamingList() {
  chrome.runtime.getPackageDirectoryEntry(function (root) {
    root.getFile("streamingServices.json", {}, function (fileEntry) {
      fileEntry.file(function (file) {
        let reader = new FileReader();
        reader.onloadend = function (e) {
          let streamingServicesJson = JSON.parse(this.result);
          let div = document.createElement("div");
          div.setAttribute("id", "streamingDiv");

          let label = document.createElement("label");
          label.setAttribute("for", "streaming");
          label.innerText = "Please select your streaming services";

          streamingServicesJson.streamingServices.forEach((stream) => {
            // create elements
            let streamWrapper = createCustomElement("a", "stream-wrapper");
            let streamLogo = createCustomElement("div", "stream-logo");
            let logo = document.createElement("img");
            let streamText = createCustomElement("div", "stream-text");
            let text = document.createElement("span");
            let streamPlus = createCustomElement("span", "stream-plus");
            let plus = document.createElement("img");

            // set attributes
            streamWrapper.setAttribute("id", "stream-wrapper" + stream.id);
            streamWrapper.setAttribute("data-checked", "0");
            streamWrapper.addEventListener("click", saveStreamService, false);
            logo.setAttribute("src", stream.logo);
            text.innerText = stream.name;
            if (
              selectedStreamServices &&
              selectedStreamServices.length > 0 &&
              selectedStreamServices.includes(stream.name)
            ) {
              streamWrapper.classList.add("stream-wrapper-selected");
              streamWrapper.setAttribute("data-checked", "1");
              plus.setAttribute("src", "images/check.svg");
            } else {
              plus.setAttribute("src", "images/plus.svg");
            }

            // add to DOM
            streamLogo.appendChild(logo);
            streamText.appendChild(text);
            streamPlus.appendChild(plus);
            if (stream.id != "0") {
              streamWrapper.appendChild(streamLogo); // no logo for first option ("Show all available..."")
            }
            streamWrapper.appendChild(streamText);
            streamWrapper.appendChild(streamPlus);
            div.appendChild(streamWrapper);
          });

          document.getElementById("streamingData").appendChild(div);
        };
        reader.readAsText(file);
      });
    });
  });
}

/**
 * Get movie name, genre (series or movie) and year from the movie's website
 * Supported websites: imdb, rottentomatoes, metacritic, letterboxd
 */
function getMovieDetailsFromWebsite() {
  const URL = window.location.href;
  let title = "";
  let genre = "";
  let year = "";

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
    return { title, genre, year };
  }

  // imdb.com
  if (URL.indexOf("imdb.com") > -1) {
    title = document.querySelector(".title_wrapper > h1");
    if (title) {
      // old imdb
      genre = document.querySelector(".np_episode_guide");
      year = document.querySelector("#titleYear");
      year = year == null ? "" : year.innerText;
      title =
        year == "" ? title.innerText : title.innerText.replace(`${year}`, "");
      genre = genre == null ? "movie" : "tv";

      year = year.replace("(", "").replace(")", "");
    } else {
      // new imdb
      title = document.querySelector(".cLLqtE");
      title = title == null ? "" : title.innerText;

      genre = document.querySelector(".episode-guide-text");
      genre = genre == null ? "movie" : "tv";

      year = null;
    }

    return { title, genre, year };
  }

  // letterboxd.com
  if (URL.indexOf("letterboxd.com") > -1) {
    title = document.querySelector("#featured-film-header > h1");
    title = title == null ? "" : title.innerText;
    year = null;
    genre = "movie";

    return { title, genre, year };
  }

  return { title, genre, year };
}
/* -------------------------------------------------------------------- */

/**
 * API HELPERS
 */

/**
 * Call TMDB API to get the id of the movie
 * @param {*} movie - movie name
 * @param {*} genre - movie type - series (tv) or movie
 * @param {*} year
 */
async function getMovie(movie, genre, year) {
  const response = await fetch(
    `https://api.themoviedb.org/3/search/${genre}?api_key=${API_KEY}&query=${movie}`
  );
  const movies = await response.json();
  return movies;
}

/**
 * Call TMDB API to get the stream providers for movie with movie type (movie or TV series)
 * @param {*} movieId - movie ID got from TMDB API - getMovie
 * @param {*} genre   - movie type - series (tv) or movie
 */
async function getStreaming(movieId, genre) {
  let response = await fetch(
    `https://api.themoviedb.org/3/${genre}/${movieId}/watch/providers?api_key=${API_KEY}`
  );
  const streams = await response.json();
  return streams;
}

/**
 * Call TMDB API to get similar movies (or TV series)
 * @param {*} movieId - movie ID got from TMDB API - getMovie
 * @param {*} genre   - movie type - series (tv) or movie
 * @param {*} page    - there are 20 results per page
 */
async function getSimilarMovies(movieId, genre, page) {
  let response = await fetch(
    `https://api.themoviedb.org/3/${genre}/${movieId}/similar?api_key=${API_KEY}&page=${page}`
  );
  const movies = await response.json();
  return movies;
}

/**
 * get the IP address
 */
async function getIPAddress() {
  const response = await fetch("https://ip.seeip.org/json");
  const data = await response.json();
  return data;
}

/**
 * get country code by IP address, to be used to fill in the country in the settings tab, on first use
 */
async function getCountryByIP() {
  const ipAddress = await getIPAddress();
  const response = await fetch(
    `https://api.astroip.co/${ipAddress.ip}/?api_key=${API_KEY_GEOLOCATION}`
  );
  const data = await response.json();
  return data && data.geo ? data.geo.country_code : null;
}
/* -------------------------------------------------------------------- */
