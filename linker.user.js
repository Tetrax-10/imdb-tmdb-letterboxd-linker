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
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

;(function () {
    const TMDB_API_KEY = GM_getValue("TMDB_API_KEY", null)

    GM_registerMenuCommand("Settings", showPopup)

    function showPopup() {
        GM_addStyle(`
#linker-settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
#linker-settings-popup {
    background-color: #20242c;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1001;
}
#linker-settings-popup input {
    color: #cfcfcf;
}
#linker-settings-popup input {
    background-color: #20242c;
    border: 1px solid #cfcfcf;
    color: #cfcfcf;
    width: 100%;
    padding: 10px;
    margin-top: 10px;
    border-radius: 8px;
}
`)

        // Create overlay
        const overlay = document.createElement("div")
        overlay.id = "linker-settings-overlay"
        overlay.onclick = (e) => {
            if (e.target === overlay) closePopup(overlay)
        }

        // popup element
        const popup = document.createElement("div")
        popup.id = "linker-settings-popup"

        // popup content
        const label = document.createElement("label")
        label.textContent = "Enter your TMDB API key:"

        // input element
        const input = document.createElement("input")
        input.type = "text"
        input.value = GM_getValue("TMDB_API_KEY", "")
        input.oninput = (e) => GM_setValue("TMDB_API_KEY", e.target.value)

        // inject popup
        popup.appendChild(label)
        popup.appendChild(input)
        overlay.appendChild(popup)
        document.body.appendChild(overlay)

        input.focus()
    }

    function closePopup(overlay) {
        document.body.removeChild(overlay)
    }

    const imdbPageCss = `
#linker-parent {
    display: flex;
    align-self: center;
}
#linker-letterboxd-link {
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
    const tmdbTitlePageCss = `
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

    const tmdbPersonPageCss = `
#linker-imdb-svg {
    --darkreader-inline-fill: #d0d0d0 !important;
}
`

    const letterboxdTitlePageCss = `
#linker-loading {
    height: 14px;
    margin-left: 4px;
}
`

    const commonUtils = (() => {
        const ImdbSvg = `<svg id="linker-imdb-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 575 289.83" width="40" height="20"><defs><path d="M575 24.91C573.44 12.15 563.97 1.98 551.91 0C499.05 0 76.18 0 23.32 0C10.11 2.17 0 14.16 0 28.61C0 51.84 0 237.64 0 260.86C0 276.86 12.37 289.83 27.64 289.83C79.63 289.83 495.6 289.83 547.59 289.83C561.65 289.83 573.26 278.82 575 264.57C575 216.64 575 48.87 575 24.91Z" id="d1pwhf9wy2"></path><path d="M69.35 58.24L114.98 58.24L114.98 233.89L69.35 233.89L69.35 58.24Z" id="g5jjnq26yS"></path><path d="M201.2 139.15C197.28 112.38 195.1 97.5 194.67 94.53C192.76 80.2 190.94 67.73 189.2 57.09C185.25 57.09 165.54 57.09 130.04 57.09L130.04 232.74L170.01 232.74L170.15 116.76L186.97 232.74L215.44 232.74L231.39 114.18L231.54 232.74L271.38 232.74L271.38 57.09L211.77 57.09L201.2 139.15Z" id="i3Prh1JpXt"></path><path d="M346.71 93.63C347.21 95.87 347.47 100.95 347.47 108.89C347.47 115.7 347.47 170.18 347.47 176.99C347.47 188.68 346.71 195.84 345.2 198.48C343.68 201.12 339.64 202.43 333.09 202.43C333.09 190.9 333.09 98.66 333.09 87.13C338.06 87.13 341.45 87.66 343.25 88.7C345.05 89.75 346.21 91.39 346.71 93.63ZM367.32 230.95C372.75 229.76 377.31 227.66 381.01 224.67C384.7 221.67 387.29 217.52 388.77 212.21C390.26 206.91 391.14 196.38 391.14 180.63C391.14 174.47 391.14 125.12 391.14 118.95C391.14 102.33 390.49 91.19 389.48 85.53C388.46 79.86 385.93 74.71 381.88 70.09C377.82 65.47 371.9 62.15 364.12 60.13C356.33 58.11 343.63 57.09 321.54 57.09C319.27 57.09 307.93 57.09 287.5 57.09L287.5 232.74L342.78 232.74C355.52 232.34 363.7 231.75 367.32 230.95Z" id="a4ov9rRGQm"></path><path d="M464.76 204.7C463.92 206.93 460.24 208.06 457.46 208.06C454.74 208.06 452.93 206.98 452.01 204.81C451.09 202.65 450.64 197.72 450.64 190C450.64 185.36 450.64 148.22 450.64 143.58C450.64 135.58 451.04 130.59 451.85 128.6C452.65 126.63 454.41 125.63 457.13 125.63C459.91 125.63 463.64 126.76 464.6 129.03C465.55 131.3 466.03 136.15 466.03 143.58C466.03 146.58 466.03 161.58 466.03 188.59C465.74 197.84 465.32 203.21 464.76 204.7ZM406.68 231.21L447.76 231.21C449.47 224.5 450.41 220.77 450.6 220.02C454.32 224.52 458.41 227.9 462.9 230.14C467.37 232.39 474.06 233.51 479.24 233.51C486.45 233.51 492.67 231.62 497.92 227.83C503.16 224.05 506.5 219.57 507.92 214.42C509.34 209.26 510.05 201.42 510.05 190.88C510.05 185.95 510.05 146.53 510.05 141.6C510.05 131 509.81 124.08 509.34 120.83C508.87 117.58 507.47 114.27 505.14 110.88C502.81 107.49 499.42 104.86 494.98 102.98C490.54 101.1 485.3 100.16 479.26 100.16C474.01 100.16 467.29 101.21 462.81 103.28C458.34 105.35 454.28 108.49 450.64 112.7C450.64 108.89 450.64 89.85 450.64 55.56L406.68 55.56L406.68 231.21Z" id="fk968BpsX"></path></defs><g><g><g><use id="linker-imdb-svg-bg" xlink:href="#d1pwhf9wy2" opacity="1" fill="#c59f00" fill-opacity="1"></use><g><use xlink:href="#d1pwhf9wy2" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#g5jjnq26yS" opacity="1" fill="#000000 !important" fill-opacity="1"></use><g><use xlink:href="#g5jjnq26yS" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#i3Prh1JpXt" opacity="1" fill="#000000 !important" fill-opacity="1"></use><g><use xlink:href="#i3Prh1JpXt" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#a4ov9rRGQm" opacity="1" fill="#000000 !important" fill-opacity="1"></use><g><use xlink:href="#a4ov9rRGQm" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#fk968BpsX" opacity="1" fill="#000000 !important" fill-opacity="1"></use><g><use xlink:href="#fk968BpsX" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g></g></g></svg>`
        const ImdbSvgWithoutBg = `<svg id="linker-imdb-svg" fill="#262626" width="800px" height="800px" viewBox="0 0 32 32" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M8.4,21.1H5.9V9.9h3.8l0.7,4.7h0.1L11,9.9h3.8v11.2h-2.5v-6.7h-0.1l-0.9,6.7H9.4l-1-6.7h0L8.4,21.1L8.4,21.1z"/><path d="M15.8,9.8c0.4,0,3.2-0.1,4.7,0.1c1.2,0.1,1.8,1.1,1.9,2.3c0.1,2.2,0.1,4.4,0.1,6.6c0,0.2,0,0.5-0.1,0.8   c-0.2,0.9-0.7,1.4-1.9,1.5c-1.5,0.1-3,0.1-4.4,0.1c0,0-0.1,0-0.2,0V9.8z M18.8,11.9v7.2c0.5,0,0.8-0.2,0.8-0.7c0-1.9,0-3.9,0-5.9   C19.6,12,19.4,11.8,18.8,11.9z"/><path d="M2,21.1V9.9h2.9v11.2H2z"/><path d="M29.9,14.1c-0.1-0.8-0.6-1.2-1.4-1.4c-0.8-0.1-1.6,0-2.3,0.7V9.9h-2.8v11.2H26c0.1-0.2,0.1-0.4,0.2-0.5c0,0,0,0,0.1,0   c0.1,0.1,0.2,0.2,0.3,0.3c0.7,0.5,1.5,0.6,2.3,0.3c0.7-0.3,1-0.9,1-1.6c0-0.8,0.1-1.7,0.1-2.6C30,16,30,15,29.9,14.1L29.9,14.1z    M27.1,19.1c0,0.2-0.2,0.4-0.4,0.4s-0.4-0.2-0.4-0.4v-4.3c0-0.2,0.2-0.4,0.4-0.4s0.4,0.2,0.4,0.4V19.1z"/></g></svg>`

        const letterboxdPng = `data:image/png;base64,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`
        const loadingGif = `data:image/gif;base64,R0lGODlh2wHgAfMAAP///ygoKDMzM0VFRVZWVmlpaX9/f5CQkKampre3t8vLy9zc3Orq6gAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFDAAAACH/C0ltYWdlTWFnaWNrDmdhbW1hPTAuNDU0NTQ1ACH/C3htcCBkYXRheG1w/z94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MSA2NC4xNDA5NDksIDIwMTAvMTIvMDctMTA6NTc6MDEgICAgICAgICI+PHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3Lncub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJmOmFib3V0PSIiIP94bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbjp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9Inj/bXAuaWlkOjUxMEY1NUQ2NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIiB4bXBNTTpEb2N1bWVudElEPSJ4cC5kaWQ6NTEwRjU1RDc3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiPiA8ZGM6cmlnaHRzPiA8cmRmOkFsdD4gPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij7CqSBpZGVvbG9neSAtIGh0dDovL3d3dy5yZWRidWJibGUuY29tL3Blb3BsZS9pZGVvbG9neTwvcmRmOmxpPiA8L3JkZjpBbHQ+IDwvZGM6cmlnaHRzPiA8eG1wTU06RGVyaXZlZEZy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eG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgV2luZG93cyIgeG1wTU06SW5zdGFuY2VJRD0ieP9tcC5paWQ6NTEwRjU1RDY3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiIHhtcE1NOkRvY3VtZW50SUQ9InhwLmRpZDo1MTBGNTVENzc4QUExMUUzQjA3M0UyOTlCMzM3N0RFMCI+IDxkYzpyaWdodHM+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPsKpIGlkZW9sb2d5IC0gaHR0Oi8vd3d3LnJlZGJ1YmJsZS5jb20vcGVvcGxlL2lkZW9sb2d5PC9yZGY6bGk+IDwvcmRmOkFsdD4gPC9kYzpyaWdodHM+IDx4bXBNTTpEZXJpdmVkRnL/b20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlkOjUxMEY1NUQ0NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjUxMEY1NUQ1NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIi8+IDwvcmRmOkRzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tDPzs3My8rJyMfGxcTDwsHAv769vLu6urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsK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YMz2/Ar4nM+qsM/8XAr+/M/ijMQCfQsEXdC2cNAIXQsqvNAGDcMOvQs8HNG9gMEUXdGCe9HC4LgaPQyg29HI0KMg3QwWOtLT4KMmnQ2M6jURAAAh+QQFDAAAACH/C0ltYWdlTWFnaWNrDmdhbW1hPTAuNDU0NTQ1ACH/C3htcCBkYXRheG1w/z94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MSA2NC4xNDA5NDksIDIwMTAvMTIvMDctMTA6NTc6MDEgICAgICAgICI+PHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3Lncub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJmOmFib3V0PSIiIP94bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbjp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9Inj/bXAuaWlkOjUxMEY1NUQ2NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIiB4bXBNTTpEb2N1bWVudElEPSJ4cC5kaWQ6NTEwRjU1RDc3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiPiA8ZGM6cmlnaHRzPiA8cmRmOkFsdD4gPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij7CqSBpZGVvbG9neSAtIGh0dDovL3d3dy5yZWRidWJibGUuY29tL3Blb3BsZS9pZGVvbG9neTwvcmRmOmxpPiA8L3JkZjpBbHQ+IDwvZGM6cmlnaHRzPiA8eG1wTU06RGVyaXZl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b20veGFwLzEuMC8iIHhtbG46eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4/21wLmlpZDo1MTBGNTVENjc4QUExMUUzQjA3M0UyOTlCMzM3N0RFMCIgeG1wTU06RG9jdW1lbnRJRD0ieHAuZGlkOjUxMEY1NUQ3NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIj4gPGRjOnJpZ2h0cz4gPHJkZjpBbHQ+IDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+wqkgaWRlb2xvZ3kgLSBodHQ6Ly93d3cucmVkYnViYmxlLmNvbS9wZW9wbGUvaWRlb2xvZ3k8L3JkZjpsaT4gPC9yZGY6QWx0PiA8L2RjOnJpZ2h0cz4gPHhtcE1NOkRlcml2ZWRGcv9vbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWQ6NTEwRjU1RDQ3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTEwRjU1RDU3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiLz4gPC9yZGY6RHNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0M/OzczLysnIx8bFxMPCwcC/vr28u7q6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEAACwMAA4AwQHBAYQAAAAoKCgz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y8zMTYm9bhkI0SzN2+nMPnkI16zFEMq84mkI3ay/3xxlJJoI4yzBa0p8mPvL7IwN6fzOrBDP8nwK9FzPpXDP+AwK+rzPntDP/pwJAB3QlzDQBC0J7nzQxpDQCh0MDN3Qv/DQEL0LfTzRC73DFr0Mj5zRF528HN0Mn/vRIB3BIh0NJF3SzPDCKG3SvbvS0zC8Lg3P/xvT2TDCNP0NTnrT6cCpbhMCACH5BAUMAAAAIf8LSW1hZ2VNYWdpY2sOZ2FtbWE9MC40NTQ1NDUAIf8LeG1wIGRhdGF4bXD/P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtdGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj48cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudy5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmY6YWJvdXQ9IiIg/3htbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgV2luZG93cyIgeG1wTU06SW5zdGFuY2VJRD0ieP9tcC5paWQ6NTEwRjU1RDY3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiIHhtcE1NOkRvY3VtZW50SUQ9InhwLmRpZDo1MTBGNTVENzc4QUExMUUzQjA3M0UyOTlCMzM3N0RFMCI+IDxkYzpyaWdodHM+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPsKpIGlkZW9sb2d5IC0gaHR0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MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj48cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudy5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmY6YWJvdXQ9IiIg/3htbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgV2luZG93cyIgeG1wTU06SW5zdGFuY2VJRD0ieP9tcC5paWQ6NTEwRjU1RDY3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiIHhtcE1NOkRvY3VtZW50SUQ9InhwLmRpZDo1MTBGNTVENzc4QUExMUUzQjA3M0UyOTlCMzM3N0RFMCI+IDxkYzpyaWdodHM+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPsKpIGlkZW9sb2d5IC0gaHR0Oi8vd3d3LnJlZGJ1YmJsZS5jb20vcGVvcGxlL2lkZW9sb2d5PC9yZGY6bGk+IDwvcmRmOkFsdD4gPC9kYzpyaWdodHM+IDx4bXBNTTpEZXJpdmVkRnL/b20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlkOjUxMEY1NUQ0NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjUxMEY1NUQ1NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIi8+IDwvcmRmOkRzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tDPzs3My8rJyMfGxcTDwsHAv769vLu6urm4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ChAKUB3VrFlptnkKVx3M1KnVSprURF0Jh19KalXpCl2dCEo5gXSQ1mytDW791tUQ13I9DXRd185w13jNDHq918fQ135dDIAd2MAw2ITtC2N92OCQ2Iq9DYzd2Nnw2JA917o82eZQ2ZZdDpid2eHAzJzNDp792esAyaIdD5Zc2qaNyqgtD0K82vfAxq6dD70a2/4wqbRNEKJ627its4cTBAAh+QQFDAAAACH/C0ltYWdlTWFnaWNrDmdhbW1hPTAuNDU0NTQ1ACH/C3htcCBkYXRheG1w/z94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MSA2NC4xNDA5NDksIDIwMTAvMTIvMDctMTA6NTc6MDEgICAgICAgICI+PHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3Lncub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJmOmFib3V0PSIiIP94bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbjp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9Inj/bXAuaWlkOjUxMEY1NUQ2NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIiB4bXBNTTpEb2N1bWVudElEPSJ4cC5kaWQ6NTEwRjU1RDc3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiPiA8ZGM6cmlnaHRzPiA8cmRmOkFsdD4gPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij7CqSBpZGVvbG9neSAtIGh0dDovL3d3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dD0iIiD/eG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG46eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4/21wLmlpZDo1MTBGNTVENjc4QUExMUUzQjA3M0UyOTlCMzM3N0RFMCIgeG1wTU06RG9jdW1lbnRJRD0ieHAuZGlkOjUxMEY1NUQ3NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIj4gPGRjOnJpZ2h0cz4gPHJkZjpBbHQ+IDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+wqkgaWRlb2xvZ3kgLSBodHQ6Ly93d3cucmVkYnViYmxlLmNvbS9wZW9wbGUvaWRlb2xvZ3k8L3JkZjpsaT4gPC9yZGY6QWx0PiA8L2RjOnJpZ2h0cz4gPHhtcE1NOkRlcml2ZWRGcv9vbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWQ6NTEwRjU1RDQ3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTEwRjU1RDU3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiLz4gPC9yZGY6RHNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0M/OzczLysnIx8bFxMPCwcC/vr28u7q6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08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jX4gzaO8pbQHBNi8zanQzd5MCuAczqIwzuTcCeZ8zpuQzupsCezczpTwzvD8CPI8z41gzPb8Cvicz6qwz/xcCv78z+KMxAJ9CwRd0LZw0AhdCyq80AYNww69Czwc0b2AwRRd0YJ70cLguBo9DKDb0cjQoyDdDBY60tPgoyadDYzqNREAACH5BAUMAAAAIf8LSW1hZ2VNYWdpY2sOZ2FtbWE9MC40NTQ1NDUAIf8LeG1wIGRhdGF4bXD/P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtdGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj48cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudy5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmY6YWJvdXQ9IiIg/3htbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgV2luZG93cyIgeG1wTU06SW5zdGFuY2VJRD0ieP9tcC5paWQ6NTEwRjU1RDY3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiIHhtcE1NOkRvY3VtZW50SUQ9InhwLmRpZDo1MTBGNTVENzc4QUExMUUzQjA3M0UyOTlCMzM3N0RFMCI+IDxkYzpyaWdodHM+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPsKpIGlkZW9sb2d5IC0gaHR0Oi8vd3d3LnJlZGJ1YmJsZS5jb20vcGVvcGxlL2lkZW9s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b3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbjp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9Inj/bXAuaWlkOjUxMEY1NUQ2NzhBQTExRTNCMDczRTI5OUIzMzc3REUwIiB4bXBNTTpEb2N1bWVudElEPSJ4cC5kaWQ6NTEwRjU1RDc3OEFBMTFFM0IwNzNFMjk5QjMzNzdERTAiPiA8ZGM6cmlnaHRzPiA8cmRmOkFsdD4gPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij7CqSBpZGVvbG9neSAtIGh0dDovL3d3dy5yZWRidWJibGUuY29tL3Blb3BsZS9pZGVvbG9neTwvcmRmOmxpPiA8L3JkZjpBbHQ+IDwvZGM6cmlnaHRzPiA8eG1wTU06RGVyaXZlZEZy/29tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5pZDo1MTBGNTVENDc4QUExMUUzQjA3M0UyOTlCMzM3N0RFMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo1MTBGNTVENTc4QUExMUUzQjA3M0UyOTlCMzM3N0RFMCIvPiA8L3JkZjpEc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LQz87NzMvKycjHxsXEw8LBwL++vby7urq5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEg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dnPxoO3k4HJbzulDt6DzSm9TFxLg7k64wyXeTYzbvqUk135e/2FuVYZbNt06t7evoe11V6sc1273s+URrVC4CyDLjjezJILseQ+LJMKu965fgut7nzoors53p5GS6n07Siuafpe/u1Lpf//5LYsO+Jv8widy1xkxdy54miaz5lkgvDNZ8vaVV9NkXkbptQkIUjCL7HAFLrphlIp4xDykDE9PbIGkwlaELO7AXpXj1hh/ILKe1ayNQ5A7ErF2x0AOspCHTOQiG/nISE6ykpfM5CY7+clQjrKUp0zlKlv5yljOspa3zGV4DODLYA6zmMdM5jKb+cxoTrOazbyzBLj5zXCOs5znTOc62/nOeM4znW2w5j77+c+ADjSb+aXnQhv60IhOdP+dXSDoRjv60ZAG87cUTelKW/rScCZBpDfN6U6neVeYDrWoR41nEHj61KhGdatIzepWt7oDqY61rCH9KVfb+taX3sCsd83rP0cK18AO9qEz0OtiG/vMgxK2spdt5wsc+9nQlrSbmE3tar/ZAtHO9rGnbe1uK7sC2g53r8/k7XILmwLiTvesv2Tudt96AuqOd6qx5O56u1oC8s53p+lt736LGt/6DvijoeTvgmMaAAJPeKMJbvCGU1rhEAc0khxOcURH/OJrnnjFN55njHsc2T/iuMjt/PGSj1njI085nE3O8i+jXOUqbznLXw7zkcvc5DSvOcdvXvKc67ziPPc4w3//LnKEBz3i/CZ6xQF+dIUnXekOZ3rTA85uqFMc3lOnetWtXnB0Z13f5OZ6173+dXXXSez9xnbZ051stLvb2WvXtqLc3m5ixx3amKK7t3V9d2ObSu/VhnXfeU0rwC/b1IOPNbQM/+4RJN7T7mI8qVvw+IErTPK57rLmN8/5znv+86APvehHT/rSm/70qE+96lfP+ta7/vWwj73sZ38IAdj+9rgXwI8UwPve997KuQ9+7iXk++IbXwFQFr7yh1+e4zu/+ExevvSZj5vnWx/6R56+9nFf/et7//dE3r74bW+a75uf90Iev/p1v5jzux/5MV6//AXz/vezWP7zh0v99381//z7n/1esX8CKDT/939nIYADaDIFWIABiIAIGDELuIBV4YAUiH7uEoERuBQVWIHfgoEYqIEbyIG74oEeCIIhKIKfQoIleBMneIKYooIkKBQt2IJ8AoMqKIMz6IJnYoM3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`

        function isMobile() {
            const data = navigator.userAgent || navigator.vendor || window.opera

            // prettier-ignore
            if (navigator.userAgentData?.mobile || /Mobi/i.test(navigator.userAgent) || navigator.maxTouchPoints || 'ontouchstart' in document.documentElement || /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(data) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(data.substr(0, 4))) {
                return true
            } else {
                return false
            }
        }

        async function waitForElement(selector, timeout = null, nthElement = 1) {
            // wait till document body loads
            while (!document.body) {
                await new Promise((resolve) => setTimeout(resolve, 10))
            }

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
                        console.error(`Can't scrape IMDb: ${imdbId}`, error)
                    },
                })
            })
        }

        function createDividerElement() {
            const divider = document.createElement("div")
            divider.id = "linker-divider"

            return divider
        }

        function createParentContainer() {
            const parentContainer = document.createElement("div")
            parentContainer.id = "linker-parent"

            return parentContainer
        }

        function createLoadingElement() {
            const loadingElement = document.createElement("img")
            loadingElement.id = "linker-loading"
            loadingElement.src = loadingGif

            return loadingElement
        }

        return {
            isMobile: isMobile,
            waitForElement: waitForElement,
            getImdbRating: getImdbRating,
            svg: {
                ImdbSvg: ImdbSvg,
                ImdbSvgWithoutBg: ImdbSvgWithoutBg,
            },
            rawImage: {
                letterboxd: letterboxdPng,
            },
            element: {
                createDividerElement: createDividerElement,
                createParentContainer: createParentContainer,
                createLoadingElement: createLoadingElement,
            },
        }
    })()

    const imdbPageUtils = (() => {
        function createLetterboxdElement(imdbId) {
            const linkElement = document.createElement("a")
            linkElement.id = "linker-letterboxd-link"
            linkElement.href = `https://letterboxd.com/imdb/${imdbId}/`
            linkElement.target = "_blank"

            const imageElement = document.createElement("img")
            imageElement.id = "linker-letterboxd"
            imageElement.src = commonUtils.rawImage.letterboxd

            linkElement.appendChild(imageElement)

            return linkElement
        }

        function createTmdbElement(tmdbData) {
            const linkElement = document.createElement("a")
            linkElement.id = "linker-tmdb-link"
            linkElement.target = "_blank"
            linkElement.innerText = "TMDB"

            if (tmdbData["media_type"] === "tv_episode") {
                linkElement.href = `https://www.themoviedb.org/tv/${tmdbData["show_id"]}/season/${tmdbData["season_number"]}/episode/${tmdbData["episode_number"]}`
            } else {
                linkElement.href = `https://www.themoviedb.org/${tmdbData["media_type"]}/${tmdbData.id}`
            }

            return linkElement
        }

        return {
            element: {
                createLetterboxdElement: createLetterboxdElement,
                createTmdbElement: createTmdbElement,
            },
        }
    })()

    async function imdbTitlePageInjector() {
        // check is mobile
        const isMobile = location.host.includes("m.imdb")

        // extract imdb id from url
        const path = location.pathname.split("/")
        const imdbId = path[2] || null

        // create elements that doesn't require any API calls
        const parentContainer = commonUtils.element.createParentContainer()
        const letterboxdElement = imdbPageUtils.element.createLetterboxdElement(imdbId)
        const dividerElement = commonUtils.element.createDividerElement()
        const loadingElement = commonUtils.element.createLoadingElement()

        // inject elements that doesn't require any API calls
        commonUtils.waitForElement("div:has( > div[data-testid='hero-rating-bar__user-rating'])", 10000, isMobile ? 2 : 1).then((element) => {
            element.insertBefore(parentContainer, element.firstChild)
            parentContainer.appendChild(letterboxdElement)
            if (!TMDB_API_KEY) return
            parentContainer.appendChild(dividerElement)
            parentContainer.appendChild(loadingElement)
        })

        if (!TMDB_API_KEY) return

        // fetch tmdb id
        const tmdbRawRes = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`)
        const tmdbRes = await tmdbRawRes.json()
        const tmdbData = tmdbRes["movie_results"]?.[0] || tmdbRes["tv_results"]?.[0] || tmdbRes["tv_episode_results"]?.[0]

        if (tmdbData) {
            // inject tmdb element and remove loading element
            const tmdbElement = imdbPageUtils.element.createTmdbElement(tmdbData)
            parentContainer.removeChild(loadingElement)
            parentContainer.appendChild(tmdbElement)
        } else {
            // if no tmdb id then remove divider and loading element
            parentContainer.removeChild(dividerElement)
            parentContainer.removeChild(loadingElement)
        }
    }

    async function imdbPersonPageInjector() {
        if (!TMDB_API_KEY) return

        // check is mobile
        const isMobile = location.host.includes("m.imdb")

        // extract imdb id from url
        const path = location.pathname.split("/")
        const imdbId = path[2] || null

        // create parent and loading element
        const parentContainer = commonUtils.element.createParentContainer()
        const loadingElement = commonUtils.element.createLoadingElement()

        // inject parent and loading element
        commonUtils.waitForElement("div:has( > .starmeter-logo)", 10000, isMobile ? 2 : 1).then((element) => {
            element.insertBefore(parentContainer, element.firstChild)
            parentContainer.appendChild(loadingElement)
        })

        // fetch tmdb id
        const tmdbRawRes = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`)
        const tmdbRes = await tmdbRawRes.json()
        const tmdbData = tmdbRes["movie_results"]?.[0] || tmdbRes["tv_results"]?.[0] || tmdbRes["tv_episode_results"]?.[0] || tmdbRes["person_results"]?.[0]

        if (tmdbData) {
            // inject tmdb element and remove loading element
            const tmdbElement = imdbPageUtils.element.createTmdbElement(tmdbData)
            parentContainer.removeChild(loadingElement)
            parentContainer.appendChild(tmdbElement)
        } else {
            // if no tmdb id then remove loading element
            parentContainer.removeChild(loadingElement)
        }
    }

    const tmdbTitlePageUtils = (() => {
        function createLetterboxdElement(tmdbId, type) {
            const linkElement = document.createElement("a")
            linkElement.href = `https://letterboxd.com/tmdb/${tmdbId}/${type === "tv" ? "tv" : ""}`
            linkElement.target = "_blank"

            const imageElement = document.createElement("img")
            imageElement.id = "linker-letterboxd"
            imageElement.src = commonUtils.rawImage.letterboxd

            linkElement.appendChild(imageElement)

            return linkElement
        }

        function createImdbContainer() {
            const imdbContainer = document.createElement("div")
            imdbContainer.id = "linker-imdb-container"

            return imdbContainer
        }

        function createImdbElement(imdbId) {
            const linkElement = document.createElement("a")
            linkElement.href = `https://imdb.com/title/${imdbId}`
            linkElement.target = "_blank"
            linkElement.innerHTML = commonUtils.svg.ImdbSvg

            return linkElement
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
                createLetterboxdElement: createLetterboxdElement,
                createImdbContainer: createImdbContainer,
                createImdbElement: createImdbElement,
                createImdbRatingElement: createImdbRatingElement,
            },
        }
    })()

    async function tmdbTitlePageInjector() {
        // check is mobile
        const isMobile = commonUtils.isMobile()

        // extract tmdb id from url
        const path = location.pathname.split("/")
        const tmdbId = path[2].match(/\d+/)?.[0] || null

        // inject elements that doesn't require any API calls
        const parentContainer = commonUtils.element.createParentContainer()
        const letterboxdElement = tmdbTitlePageUtils.element.createLetterboxdElement(tmdbId, path[1])
        const dividerElement = commonUtils.element.createDividerElement()
        const imdbContainer = tmdbTitlePageUtils.element.createImdbContainer()
        const loadingElement = commonUtils.element.createLoadingElement()

        commonUtils.waitForElement(`.header.poster${isMobile ? " > .title" : ""}`, 10000).then((element) => {
            if (isMobile) {
                element.insertBefore(parentContainer, element?.firstChild?.nextSibling?.nextSibling)
            } else {
                element.appendChild(parentContainer)
            }

            parentContainer.appendChild(letterboxdElement)
            if (!TMDB_API_KEY) return
            parentContainer.appendChild(dividerElement)
            parentContainer.appendChild(imdbContainer)
            imdbContainer.appendChild(loadingElement)
        })

        if (!TMDB_API_KEY) return

        // fetch imdb id
        const tmdbRawRes = await fetch(`https://api.themoviedb.org/3/${path[1]}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`)
        const tmdbRes = await tmdbRawRes.json()
        const imdbId = tmdbRes["imdb_id"] || null

        // exit if no IMDb Id found
        if (!imdbId) {
            parentContainer.removeChild(dividerElement)
            parentContainer.removeChild(imdbContainer)
            return
        }

        // inject imdb element
        const imdbElement = tmdbTitlePageUtils.element.createImdbElement(imdbId)
        commonUtils.waitForElement(`.header.poster${isMobile ? " > .title" : ""}`, 10000).then(() => {
            imdbContainer.insertBefore(imdbElement, loadingElement)
        })

        // scrape IMDb ratings
        const [imdbRating, imdbNumRating] = await commonUtils.getImdbRating(imdbId)

        // inject imdb rating element
        const imdbRatingElement = tmdbTitlePageUtils.element.createImdbRatingElement(imdbRating, imdbNumRating)
        imdbContainer.removeChild(loadingElement)
        if (imdbRatingElement) imdbContainer.appendChild(imdbRatingElement)
    }

    const tmdbPersonPageUtils = (() => {
        function createImdbElement(imdbId) {
            const linkContainer = document.createElement("div")

            const linkElement = document.createElement("a")
            linkElement.className = "social_link"
            linkElement.href = `https://www.imdb.com/name/${imdbId}`
            linkElement.target = "_blank"
            linkElement.title = "Visit IMDb"

            const svgContainer = document.createElement("div")
            svgContainer.className = "glyphicons_v2"
            svgContainer.style.width = "50px"
            svgContainer.innerHTML = commonUtils.svg.ImdbSvgWithoutBg

            linkElement.appendChild(svgContainer)
            linkContainer.appendChild(linkElement)

            return linkContainer
        }

        return {
            element: {
                createImdbElement: createImdbElement,
            },
        }
    })()

    async function tmdbPersonPageInjector() {
        if (!TMDB_API_KEY) return

        // extract tmdb id from url
        const path = location.pathname.split("/")
        const tmdbId = path[2].match(/\d+/)?.[0] || null

        // fetch imdb id
        const tmdbRawRes = await fetch(`https://api.themoviedb.org/3/${path[1]}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`)
        const tmdbRes = await tmdbRawRes.json()
        const imdbId = tmdbRes["imdb_id"] || null

        // inject imdb element
        if (imdbId) {
            const imdbElement = tmdbPersonPageUtils.element.createImdbElement(imdbId)

            commonUtils.waitForElement(`.social_links`, 10000).then((element) => {
                element.insertBefore(imdbElement, element.firstChild)
            })
        }
    }

    function letterboxdTitlePageInjector() {
        commonUtils.waitForElement(`.micro-button.track-event[data-track-action="IMDb"]`, 10000).then(async (element) => {
            // preserve original display style
            const originalDisplayStyle = element.style.display

            // inject loading element
            const loadingElement = commonUtils.element.createLoadingElement()
            element.style.display = "inline-flex"
            element.appendChild(loadingElement)

            // fetch imdb id and get ratings
            const imdbId = element.href?.match(/\/title\/(tt\d+)\/?/)?.[1] ?? null
            const [imdbRating, imdbNumRating] = await commonUtils.getImdbRating(imdbId)

            // remove loading element
            element.removeChild(loadingElement)
            element.style.display = originalDisplayStyle

            // update imdb button
            element.innerText = `IMDB${imdbRating ? ` | ${imdbRating}` : ""}${imdbNumRating !== undefined ? ` (${imdbNumRating})` : ""}`
        })
    }

    const currentURL = location.protocol + "//" + location.hostname + location.pathname

    if (/^(https?:\/\/[^.]+\.imdb\.com\/title\/tt[^\/]+(?:\/\?.*)?\/?)$/.test(currentURL)) {
        // IMDb title page
        GM_addStyle(imdbPageCss)
        imdbTitlePageInjector()
    } else if (/^(https?:\/\/[^.]+\.imdb\.com\/name\/nm[^\/]+(?:\/\?.*)?\/?)$/.test(currentURL)) {
        // IMDb person page
        GM_addStyle(imdbPageCss)
        imdbPersonPageInjector()
    } else if (/^(https?:\/\/[^.]+\.themoviedb\.org\/(movie|tv)\/\d[^\/]+(?:\/\?.*)?\/?)$/.test(currentURL)) {
        // TMDB title page
        GM_addStyle(tmdbTitlePageCss)
        tmdbTitlePageInjector()
    } else if (/^(https?:\/\/[^.]+\.themoviedb\.org\/person\/\d[^\/]+(?:\/\?.*)?\/?)$/.test(currentURL)) {
        // TMDB person page
        GM_addStyle(tmdbPersonPageCss)
        tmdbPersonPageInjector()
    } else if (/^(https?:\/\/letterboxd\.com\/film\/[^\/]+(?:\/\?.*)?\/?(crew|details|genres)?)$/.test(currentURL)) {
        // Letterboxd title page
        GM_addStyle(letterboxdTitlePageCss)
        letterboxdTitlePageInjector()
    }
})()
