// ==UserScript==
// @name         Book Finder Results Highlighter
// @namespace    http://tampermonkey.net/
// @version      2024-02-17
// @description  Highlight the first relevant search results in new & used
// @author       Christopher McCulloh
// @match        https://www.bookfinder.com/isbn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bookfinder.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let lowestNewPrice = Infinity;
    let lowestUsedPrice = Infinity;

    const badWords = ['library', 'ex-library', 'lib', 'ex-lib', 'missing'];
    const badWordsRegex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'gi');

    const goodWords = ['dj', 'dust-jacket', 'dust jacket'];
    const goodWordsRegex = new RegExp(`\\b(${goodWords.join('|')})\\b`, 'gi');

    const highlightWords = () => {
        document.querySelectorAll('.bf-search-result-wrapper').forEach(result => {
            result.innerHTML = result.innerHTML.replace(badWordsRegex, '<span class="highlighted-bad-word">$1</span>');
            result.innerHTML = result.innerHTML.replace(goodWordsRegex, '<span class="highlighted-good-word">$1</span>');
        });
    };

    const addHighlightingCSS = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            .highlighted-bad-word {
                background-color: #ff0000;
                font-weight: bold;
                color: #fff;
            }

            .highlighted-good-word {
                background-color: #0f0;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    };

    const highlightBooks = (col, kind) => {
        const searchResults = col.querySelectorAll('.bf-search-result-wrapper');
        let firstResultWithoutWords = null;

        for (const result of searchResults) {
            const text = result.textContent.toLowerCase();
            if (!text.match(badWordsRegex) &&
                (text.includes('very good') || text.includes('new'))) {
                firstResultWithoutWords = result;
                firstResultWithoutWords.style.border = '12px solid green';
                displayLowestPrices(firstResultWithoutWords, kind);
            } else {
                result.style.backgroundColor = '#baa';
            }
        }
    };

    const extractPrice = (priceString) => {
        const match = priceString.match(/\$([0-9.,]+)/);
        return match ? parseFloat(match[1].replace(/,/g, '')) : null;
    };

    const displayLowestPrices = (result, kind) => {
        const priceLinks = result.querySelectorAll('.clickout-logger');

        priceLinks.forEach(link => {
            const price = extractPrice(link.textContent);
            if (price !== null) {
                // Determine if the price is for new or used and update lowest prices
                // This might need additional logic based on how new and used prices are distinguished on the page
                if (kind === 'used') {
                    lowestUsedPrice = Math.min(lowestUsedPrice, price);
                } else {
                    lowestNewPrice = Math.min(lowestNewPrice, price);
                }

            }
        });

        const priceDiv = document.createElement('div');
        priceDiv.style.position = 'fixed';
        priceDiv.style.top = '0';
        priceDiv.style.right = '0';
        priceDiv.style.width = '350px';
        priceDiv.style.height = '170px';
        priceDiv.style.backgroundColor = 'green';
        priceDiv.style.color = 'white';
        priceDiv.style.fontSize = '50px';
        priceDiv.style.padding = '10px';
        priceDiv.style.boxSizing = 'border-box';
        priceDiv.style.zIndex = '1000';
        priceDiv.style.textAlign = 'center';
        priceDiv.innerHTML = `<strong>New:</strong> ${lowestNewPrice === Infinity ? 'N/A' : `$${lowestNewPrice.toFixed(2)}`}<br><strong>Used:</strong> ${lowestUsedPrice === Infinity ? 'N/A' : `$${lowestUsedPrice.toFixed(2)}`}`;

        document.body.appendChild(priceDiv);
    };

    const startObserving = () => {

        const targetNode = document.querySelector('body'); // Change this if necessary

        const config = { childList: true, subtree: true };

        const callback = (mutationsList, observer) => {

            for(const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {

                    const newBooks = document.querySelector('.grid-item');
                    const usedBooks = document.querySelector('.grid-item.bf-two-column-grid-item-right');
                    if (newBooks || usedBooks) {
                        highlightBooks(newBooks, 'new');
                        highlightBooks(usedBooks, 'used');
                        highlightWords();

                        observer.disconnect(); // Optional
                        break;
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    };

    window.addEventListener('load', () => {
        startObserving();

        addHighlightingCSS();
    });
})();
