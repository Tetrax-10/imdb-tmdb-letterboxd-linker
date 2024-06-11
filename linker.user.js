// ==UserScript==
// @name         IMDb TMDB Linker
// @description  Opens the corresponding IMDB/TMDB/Letterboxd movie/tv page in just one click. Also adds the ability to see IMDB ratings on TMDB and Letterboxd pages.
// @author       Tetrax-10
// @namespace    https://github.com/Tetrax-10/imdb-tmdb-linker
// @version      1.2
// @license      MIT
// @match        *://*.imdb.com/title/tt*
// @match        *://*.imdb.com/name/nm*
// @match        *://*.themoviedb.org/movie/*
// @match        *://*.themoviedb.org/tv/*
// @match        *://*.themoviedb.org/person/*
// @match        *://*.letterboxd.com/film/*
// @connect      imdb.com
// @connect      themoviedb.org
// @homepageURL  https://github.com/Tetrax-10/imdb-tmdb-linker
// @supportURL   https://github.com/Tetrax-10/imdb-tmdb-linker/issues
// @updateURL    https://tetrax-10.github.io/imdb-tmdb-linker/linker.user.js
// @downloadURL  https://tetrax-10.github.io/imdb-tmdb-linker/linker.user.js
// @icon         https://tetrax-10.github.io/imdb-tmdb-linker/assets/icon.png
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

;(function () {
    const tmdbApi = "YOUR_TMDB_API_KEY"

    const imdbCss = `
#linker-parent {
    display: flex;
    align-self: center;
}
#linker-letterboxd-a {
    align-self: center;
}
#linker-letterboxd {
    display: flex;
    height: 30px;
    border-radius: 4px;
}
#linker-divider {
    border-left: 3px solid rgba(232, 230, 227, 0.5) !important;
    height: 25px;
    border-radius: 10px;
    margin-left: 10px;
    align-self: center;
}
#linker-loading {
    height: 20px;
    align-self: center;
    text-align: center;
    margin-left: 10px;
    margin-right: 40px;
}
#linker-tmdb-link {
    height: 26px;
    width: 70px;
    background: #022036 !important;
    color: #51b4ad !important;
    border: solid #51b4ad 2px !important;
    border-radius: 6px;
    align-self: center;
    margin-left: 10px;
    margin-right: 20px;
    font-weight: bold;
    text-align: center;
}
@media only screen and (max-width: 767px) {
    #linker-loading {
        margin-right: 6px;
    }
    #linker-tmdb-link {
        width: 48px;
        margin-left: 10px;
        margin-right: 10px;
        font-size: smaller;
    }
}    
`
    const tmdbCss = `
#linker-parent {
    margin-top: 20px;
    display: flex;
    align-items: flex-start;
}
#linker-imdb-svg-bg {
    fill: #c59f00 !important;
}
#linker-divider {
    border-left: 2px solid rgba(232, 230, 227, 0.5) !important;
    height: 20px;
    border-radius: 10px;
    margin-left: 10px;
}
#linker-letterboxd {
    height: 22px;
    border-radius: 4px;
}
#linker-loading {
    height: 20px;
    margin-left: 10px;
}
#linker-imdb-container {
    display: flex;
    align-items: flex-start;
    margin-left: 10px;
}
#linker-imdb-rating {
    margin-left: 10px;
}
html.k-mobile #linker-parent {
    margin-top: unset;
    margin-left: auto;
    margin-right: auto;
}    
`

    const tmdbPersonCss = `
#linker-loading {
    height: 28px;
}
#linker-imdb-svg {
    --darkreader-inline-fill: #d0d0d0 !important;
}
`

    const letterboxdCss = `
#linker-loading {
    height: 14px;
    margin-left: 4px;
}
`

    const ImdbSvg = `<svg id="linker-imdb-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 575 289.83" width="40" height="20"><defs><path d="M575 24.91C573.44 12.15 563.97 1.98 551.91 0C499.05 0 76.18 0 23.32 0C10.11 2.17 0 14.16 0 28.61C0 51.84 0 237.64 0 260.86C0 276.86 12.37 289.83 27.64 289.83C79.63 289.83 495.6 289.83 547.59 289.83C561.65 289.83 573.26 278.82 575 264.57C575 216.64 575 48.87 575 24.91Z" id="d1pwhf9wy2"></path><path d="M69.35 58.24L114.98 58.24L114.98 233.89L69.35 233.89L69.35 58.24Z" id="g5jjnq26yS"></path><path d="M201.2 139.15C197.28 112.38 195.1 97.5 194.67 94.53C192.76 80.2 190.94 67.73 189.2 57.09C185.25 57.09 165.54 57.09 130.04 57.09L130.04 232.74L170.01 232.74L170.15 116.76L186.97 232.74L215.44 232.74L231.39 114.18L231.54 232.74L271.38 232.74L271.38 57.09L211.77 57.09L201.2 139.15Z" id="i3Prh1JpXt"></path><path d="M346.71 93.63C347.21 95.87 347.47 100.95 347.47 108.89C347.47 115.7 347.47 170.18 347.47 176.99C347.47 188.68 346.71 195.84 345.2 198.48C343.68 201.12 339.64 202.43 333.09 202.43C333.09 190.9 333.09 98.66 333.09 87.13C338.06 87.13 341.45 87.66 343.25 88.7C345.05 89.75 346.21 91.39 346.71 93.63ZM367.32 230.95C372.75 229.76 377.31 227.66 381.01 224.67C384.7 221.67 387.29 217.52 388.77 212.21C390.26 206.91 391.14 196.38 391.14 180.63C391.14 174.47 391.14 125.12 391.14 118.95C391.14 102.33 390.49 91.19 389.48 85.53C388.46 79.86 385.93 74.71 381.88 70.09C377.82 65.47 371.9 62.15 364.12 60.13C356.33 58.11 343.63 57.09 321.54 57.09C319.27 57.09 307.93 57.09 287.5 57.09L287.5 232.74L342.78 232.74C355.52 232.34 363.7 231.75 367.32 230.95Z" id="a4ov9rRGQm"></path><path d="M464.76 204.7C463.92 206.93 460.24 208.06 457.46 208.06C454.74 208.06 452.93 206.98 452.01 204.81C451.09 202.65 450.64 197.72 450.64 190C450.64 185.36 450.64 148.22 450.64 143.58C450.64 135.58 451.04 130.59 451.85 128.6C452.65 126.63 454.41 125.63 457.13 125.63C459.91 125.63 463.64 126.76 464.6 129.03C465.55 131.3 466.03 136.15 466.03 143.58C466.03 146.58 466.03 161.58 466.03 188.59C465.74 197.84 465.32 203.21 464.76 204.7ZM406.68 231.21L447.76 231.21C449.47 224.5 450.41 220.77 450.6 220.02C454.32 224.52 458.41 227.9 462.9 230.14C467.37 232.39 474.06 233.51 479.24 233.51C486.45 233.51 492.67 231.62 497.92 227.83C503.16 224.05 506.5 219.57 507.92 214.42C509.34 209.26 510.05 201.42 510.05 190.88C510.05 185.95 510.05 146.53 510.05 141.6C510.05 131 509.81 124.08 509.34 120.83C508.87 117.58 507.47 114.27 505.14 110.88C502.81 107.49 499.42 104.86 494.98 102.98C490.54 101.1 485.3 100.16 479.26 100.16C474.01 100.16 467.29 101.21 462.81 103.28C458.34 105.35 454.28 108.49 450.64 112.7C450.64 108.89 450.64 89.85 450.64 55.56L406.68 55.56L406.68 231.21Z" id="fk968BpsX"></path></defs><g><g><g><use id="linker-imdb-svg-bg" xlink:href="#d1pwhf9wy2" opacity="1" fill="#c59f00" fill-opacity="1"></use><g><use xlink:href="#d1pwhf9wy2" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#g5jjnq26yS" opacity="1" fill="#000000 !important" fill-opacity="1"></use><g><use xlink:href="#g5jjnq26yS" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#i3Prh1JpXt" opacity="1" fill="#000000 !important" fill-opacity="1"></use><g><use xlink:href="#i3Prh1JpXt" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#a4ov9rRGQm" opacity="1" fill="#000000 !important" fill-opacity="1"></use><g><use xlink:href="#a4ov9rRGQm" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#fk968BpsX" opacity="1" fill="#000000 !important" fill-opacity="1"></use><g><use xlink:href="#fk968BpsX" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g></g></g></svg>` // prettier-ignore
    const ImdbSvgWithoutBg = `<svg id="linker-imdb-svg" fill="#262626" width="800px" height="800px" viewBox="0 0 32 32" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M8.4,21.1H5.9V9.9h3.8l0.7,4.7h0.1L11,9.9h3.8v11.2h-2.5v-6.7h-0.1l-0.9,6.7H9.4l-1-6.7h0L8.4,21.1L8.4,21.1z"/><path d="M15.8,9.8c0.4,0,3.2-0.1,4.7,0.1c1.2,0.1,1.8,1.1,1.9,2.3c0.1,2.2,0.1,4.4,0.1,6.6c0,0.2,0,0.5-0.1,0.8   c-0.2,0.9-0.7,1.4-1.9,1.5c-1.5,0.1-3,0.1-4.4,0.1c0,0-0.1,0-0.2,0V9.8z M18.8,11.9v7.2c0.5,0,0.8-0.2,0.8-0.7c0-1.9,0-3.9,0-5.9   C19.6,12,19.4,11.8,18.8,11.9z"/><path d="M2,21.1V9.9h2.9v11.2H2z"/><path d="M29.9,14.1c-0.1-0.8-0.6-1.2-1.4-1.4c-0.8-0.1-1.6,0-2.3,0.7V9.9h-2.8v11.2H26c0.1-0.2,0.1-0.4,0.2-0.5c0,0,0,0,0.1,0   c0.1,0.1,0.2,0.2,0.3,0.3c0.7,0.5,1.5,0.6,2.3,0.3c0.7-0.3,1-0.9,1-1.6c0-0.8,0.1-1.7,0.1-2.6C30,16,30,15,29.9,14.1L29.9,14.1z    M27.1,19.1c0,0.2-0.2,0.4-0.4,0.4s-0.4-0.2-0.4-0.4v-4.3c0-0.2,0.2-0.4,0.4-0.4s0.4,0.2,0.4,0.4V19.1z"/></g></svg>`

    async function waitForElement(selector, timeout = null, nthElement = 1) {
        nthElement -= 1

        return new Promise((resolve) => {
            if (document.querySelectorAll(selector)?.[nthElement]) {
                return resolve(document.querySelectorAll(selector)?.[nthElement])
            }

            const observer = new MutationObserver(async () => {
                if (document.querySelectorAll(selector)?.[nthElement]) {
                    resolve(document.querySelectorAll(selector)?.[nthElement])
                    observer.disconnect()
                } else {
                    if (timeout) {
                        async function timeOver() {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    observer.disconnect()
                                    resolve(false)
                                }, timeout)
                            })
                        }
                        resolve(await timeOver())
                    }
                }
            })

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            })
        })
    }

    async function getImdbRating(imdbId) {
        if (!imdbId) return [undefined, undefined]

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://www.imdb.com/title/${imdbId}/ratings`,
                onload: function (response) {
                    const parser = new DOMParser()
                    const dom = parser.parseFromString(response.responseText, "text/html")

                    const rating = dom.querySelector(`div[data-testid="rating-button__aggregate-rating__score"] > span`)?.innerText
                    const numRating = dom.querySelector(`div[data-testid="rating-button__aggregate-rating__score"] + div`)?.innerText

                    resolve([rating, numRating])
                },
                onerror: function (error) {
                    console.error("Request failed:", error)
                },
            })
        })
    }

    const imdbUtils = (() => {
        function createParentElement() {
            const parentElement = document.createElement("div")
            parentElement.id = "linker-parent"

            return parentElement
        }

        function createLetterboxdElement(imdbId) {
            const letterboxdElement = document.createElement("a")
            letterboxdElement.id = "linker-letterboxd-a"
            letterboxdElement.href = `https://letterboxd.com/imdb/${imdbId}/`
            letterboxdElement.target = "_blank"

            const letterboxdImage = document.createElement("img")
            letterboxdImage.id = "linker-letterboxd"
            letterboxdImage.src = "https://tetrax-10.github.io/imdb-tmdb-linker/assets/letterboxd.png"

            letterboxdElement.appendChild(letterboxdImage)

            return letterboxdElement
        }

        function createDivider() {
            const divider = document.createElement("div")
            divider.id = "linker-divider"

            return divider
        }

        function createLoadingElement() {
            const loadingElement = document.createElement("img")
            loadingElement.id = "linker-loading"
            loadingElement.src = "https://tetrax-10.github.io/imdb-tmdb-linker/assets/loading.gif"

            return loadingElement
        }

        function createTmdbButtonElement(tmdbData) {
            const tmdbElement = document.createElement("a")
            tmdbElement.id = "linker-tmdb-link"
            tmdbElement.target = "_blank"
            tmdbElement.innerText = "TMDB"

            if (tmdbData["media_type"] !== "tv_episode") {
                tmdbElement.href = `https://www.themoviedb.org/${tmdbData["media_type"]}/${tmdbData.id}`
            } else {
                tmdbElement.href = `https://www.themoviedb.org/tv/${tmdbData["show_id"]}/season/${tmdbData["season_number"]}/episode/${tmdbData["episode_number"]}`
            }

            return tmdbElement
        }

        return {
            element: {
                parent: createParentElement,
                letterboxd: createLetterboxdElement,
                divider: createDivider,
                loading: createLoadingElement,
                tmdbButton: createTmdbButtonElement,
            },
        }
    })()

    async function imdb() {
        const isMobile = location.host.includes("m.imdb")

        const path = location.pathname.split("/")
        const imdbId = path[2] || null

        if (imdbId) {
            const parentElement = imdbUtils.element.parent()
            const letterboxdElement = imdbUtils.element.letterboxd(imdbId)
            const dividerElement = imdbUtils.element.divider()
            const loadingElement = imdbUtils.element.loading()

            waitForElement("div:has( > div[data-testid='hero-rating-bar__user-rating'])", 10000, isMobile ? 2 : 1).then((location) => {
                location.insertBefore(parentElement, location.firstChild)
                parentElement.appendChild(letterboxdElement)
                parentElement.appendChild(dividerElement)
                parentElement.appendChild(loadingElement)
            })

            const tmdbRawRes = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbApi}&external_source=imdb_id`)
            const tmdbRes = await tmdbRawRes.json()
            const tmdbData = tmdbRes["movie_results"]?.[0] || tmdbRes["tv_results"]?.[0] || tmdbRes["tv_episode_results"]?.[0]

            if (tmdbData) {
                const imdbElement = imdbUtils.element.tmdbButton(tmdbData)
                parentElement.removeChild(loadingElement)
                parentElement.appendChild(imdbElement)
            } else {
                parentElement.removeChild(dividerElement)
                parentElement.removeChild(loadingElement)
            }
        }
    }

    async function imdbPerson() {
        const isMobile = location.host.includes("m.imdb")

        const path = location.pathname.split("/")
        const imdbId = path[2] || null

        if (imdbId) {
            const parentElement = imdbUtils.element.parent()
            const loadingElement = imdbUtils.element.loading()

            waitForElement("div:has( > .starmeter-logo)", 10000, isMobile ? 2 : 1).then((location) => {
                location.insertBefore(parentElement, location.firstChild)
                parentElement.appendChild(loadingElement)
            })

            const tmdbRawRes = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbApi}&external_source=imdb_id`)
            const tmdbRes = await tmdbRawRes.json()
            const tmdbData = tmdbRes["movie_results"]?.[0] || tmdbRes["tv_results"]?.[0] || tmdbRes["tv_episode_results"]?.[0] || tmdbRes["person_results"]?.[0]

            if (tmdbData) {
                const imdbElement = imdbUtils.element.tmdbButton(tmdbData)
                parentElement.removeChild(loadingElement)
                parentElement.appendChild(imdbElement)
            } else {
                parentElement.removeChild(loadingElement)
            }
        }
    }

    const tmdbUtils = (() => {
        function createParentElement() {
            const parentElement = document.createElement("div")
            parentElement.id = "linker-parent"

            return parentElement
        }

        function createLetterboxdElement(tmdbId, type) {
            const letterboxdElement = document.createElement("a")
            letterboxdElement.href = `https://letterboxd.com/tmdb/${tmdbId}/${type === "tv" ? "tv" : ""}`
            letterboxdElement.target = "_blank"

            const letterboxdImage = document.createElement("img")
            letterboxdImage.id = "linker-letterboxd"
            letterboxdImage.src = "https://tetrax-10.github.io/imdb-tmdb-linker/assets/letterboxd.png"

            letterboxdElement.appendChild(letterboxdImage)

            return letterboxdElement
        }

        function createDivider() {
            const divider = document.createElement("div")
            divider.id = "linker-divider"

            return divider
        }

        function createImdbContainer() {
            const imdbContainer = document.createElement("div")
            imdbContainer.id = "linker-imdb-container"

            return imdbContainer
        }

        function createImdbLinkElement(imdbId, svg) {
            const link = document.createElement("a")
            link.href = `https://imdb.com/title/${imdbId}`
            link.target = "_blank"
            link.innerHTML = svg

            return link
        }

        function createImdbRatingElement(rating, numRatings) {
            const text = rating !== undefined ? `${rating}${numRatings !== undefined ? ` ( ${numRatings} )` : ""}` : null

            const ratingElement = document.createElement("div")
            ratingElement.id = "linker-imdb-rating"
            ratingElement.innerText = text

            if (text) {
                return ratingElement
            } else {
                return null
            }
        }

        return {
            element: {
                parent: createParentElement,
                letterboxd: createLetterboxdElement,
                divider: createDivider,
                imdbContainer: createImdbContainer,
                imdbLink: createImdbLinkElement,
                imdbRating: createImdbRatingElement,
            },
        }
    })()

    async function tmdb() {
        const isMobile = document.querySelector("html.k-mobile")
        const path = location.pathname.split("/")
        const tmdbId = path[2].match(/\d+/)?.[0] || null

        if (tmdbId) {
            const parentElement = tmdbUtils.element.parent()
            const letterboxdElement = tmdbUtils.element.letterboxd(tmdbId, path[1])
            const divider = tmdbUtils.element.divider()
            const imdbContainer = tmdbUtils.element.imdbContainer()
            const loadingElement = imdbUtils.element.loading()

            waitForElement(`.header.poster${isMobile ? " > .title" : ""}`, 10000).then((location) => {
                if (isMobile) {
                    location.insertBefore(parentElement, location?.firstChild?.nextSibling?.nextSibling)
                } else {
                    location.appendChild(parentElement)
                }

                parentElement.appendChild(letterboxdElement)
                parentElement.appendChild(divider)
                parentElement.appendChild(imdbContainer)
                imdbContainer.appendChild(loadingElement)
            })

            // fetch imdb id
            const tmdbRawRes = await fetch(`https://api.themoviedb.org/3/${path[1]}/${tmdbId}/external_ids?api_key=${tmdbApi}`)
            if (tmdbRawRes.status !== 200) return
            const tmdbRes = await tmdbRawRes.json()
            const imdbId = tmdbRes["imdb_id"] || null

            if (!imdbId) {
                parentElement.removeChild(divider)
                parentElement.removeChild(imdbContainer)
                return
            }

            // inject imdb link
            const imdbLink = tmdbUtils.element.imdbLink(imdbId, ImdbSvg)
            imdbContainer.insertBefore(imdbLink, loadingElement)

            // inject imdb rating
            const [imdbRating, imdbNumRating] = await getImdbRating(imdbId)
            const imdbRatingElement = tmdbUtils.element.imdbRating(imdbRating, imdbNumRating)
            imdbContainer.removeChild(loadingElement)
            if (!imdbRatingElement) return
            imdbContainer.appendChild(imdbRatingElement)
        }
    }

    const tmdbPersonUtils = (() => {
        function createParentElement() {
            const parentElement = document.createElement("div")
            parentElement.id = "linker-parent"

            return parentElement
        }

        function createImdbLinkElement(imdbId) {
            const anchor = document.createElement("a")
            anchor.className = "social_link"
            anchor.href = `https://www.imdb.com/name/${imdbId}`
            anchor.target = "_blank"

            const childDiv = document.createElement("div")
            childDiv.className = "glyphicons_v2"
            childDiv.style.width = "50px"

            childDiv.innerHTML = ImdbSvgWithoutBg
            anchor.appendChild(childDiv)

            return anchor
        }

        return {
            element: {
                parent: createParentElement,
                imdbLink: createImdbLinkElement,
            },
        }
    })()

    async function tmdbPerson() {
        const path = location.pathname.split("/")
        const tmdbId = path[2].match(/\d+/)?.[0] || null

        const parentElement = tmdbPersonUtils.element.parent()
        const loadingElement = imdbUtils.element.loading()

        waitForElement(`.social_links`, 10000).then((element) => {
            parentElement.appendChild(loadingElement)
            element.insertBefore(parentElement, element.firstChild)
        })

        // fetch imdb id
        const tmdbRawRes = await fetch(`https://api.themoviedb.org/3/${path[1]}/${tmdbId}/external_ids?api_key=${tmdbApi}`)
        if (tmdbRawRes.status !== 200) return
        const tmdbRes = await tmdbRawRes.json()
        const imdbId = tmdbRes["imdb_id"] || null

        if (!imdbId) {
            parentElement.removeChild(loadingElement)
            const socialLinksElement = await waitForElement(`.social_links`, 10000)
            socialLinksElement.removeChild(parentElement)
            return
        }

        const imdbLinkElement = tmdbPersonUtils.element.imdbLink(imdbId)
        parentElement.removeChild(loadingElement)
        parentElement.appendChild(imdbLinkElement)
    }

    function letterboxd() {
        waitForElement(`.micro-button.track-event[data-track-action="IMDb"]`, 10000).then(async (element) => {
            const originalDisplay = element.style.display

            // add loading element
            const loadingElement = imdbUtils.element.loading()
            element.style.display = "inline-flex"
            element.appendChild(loadingElement)

            // fetch imdb id and get ratings
            const imdbId = element.href?.match(/\/title\/(tt\d+)\/?/)?.[1] ?? null
            const [imdbRating, imdbNumRating] = await getImdbRating(imdbId)

            // remove loading element
            element.removeChild(loadingElement)
            element.style.display = originalDisplay

            // update element
            element.innerText = `IMDB${imdbRating ? ` | ${imdbRating}` : ""}${imdbNumRating !== undefined ? ` (${imdbNumRating})` : ""}`
        })
    }

    const currentURL = window.location.protocol + "//" + window.location.hostname + window.location.pathname

    if (/^(https?:\/\/[^.]+\.imdb\.com\/title\/tt[^\/]+(?:\/\?.*)?\/?)$/.test(currentURL)) {
        GM_addStyle(imdbCss)
        imdb()
    }
    if (/^(https?:\/\/[^.]+\.imdb\.com\/name\/nm[^\/]+(?:\/\?.*)?\/?)$/.test(currentURL)) {
        GM_addStyle(imdbCss)
        imdbPerson()
    }
    if (/^(https?:\/\/[^.]+\.themoviedb\.org\/(movie|tv)\/\d[^\/]+(?:\/\?.*)?\/?)$/.test(currentURL)) {
        GM_addStyle(tmdbCss)
        tmdb()
    }
    if (/^(https?:\/\/[^.]+\.themoviedb\.org\/person\/\d[^\/]+(?:\/\?.*)?\/?)$/.test(currentURL)) {
        GM_addStyle(tmdbPersonCss)
        tmdbPerson()
    }
    if (/^(https?:\/\/letterboxd\.com\/film\/[^\/]+(?:\/\?.*)?\/?(crew|details|genres)?)$/.test(currentURL)) {
        GM_addStyle(letterboxdCss)
        letterboxd()
    }
})()
