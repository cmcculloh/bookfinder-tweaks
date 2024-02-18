// ==UserScript==
// @name         Bookfinder Helper
// @namespace    http://tampermonkey.net/
// @version      2024-02-17
// @description  Streamline ISBN entry for price lookup on bookfinder.com
// @author       Christopher McCulloh
// @match        https://www.bookfinder.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bookfinder.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let otherInputInteracted = false;

    // Function to validate ISBN-10
    const isValidISBN10 = (isbn) => {
        if (isbn.length !== 10) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let digit = parseInt(isbn[i]);
            if (isNaN(digit)) return false;
            sum += (digit * (10 - i));
        }
        let checksum = isbn[9].toUpperCase();
        checksum = (checksum === 'X') ? 10 : parseInt(checksum);
        if (isNaN(checksum)) return false;

        return (sum + checksum) % 11 === 0;
    };

    // Function to validate ISBN-13
    const isValidISBN13 = (isbn) => {
        if (isbn.length !== 13) return false;

        let sum = 0;
        for (let i = 0; i < 13; i++) {
            let digit = parseInt(isbn[i]);
            if (isNaN(digit)) return false;
            sum += digit * (i % 2 === 0 ? 1 : 3);
        }

        return sum % 10 === 0;
    };

    // Combined ISBN validation
    const isValidISBN = (isbn) => {
        isbn = isbn.replace(/\-/g, '');
        return isValidISBN10(isbn) || isValidISBN13(isbn);
    };

    // Function to handle input changes for ISBN
    const handleISBNInputChange = (event) => {
        if (!otherInputInteracted && isValidISBN(event.target.value)) {
            console.log('submit');

            // Click the submit button
            const submitButton = document.querySelector('#search_form > div.form-group.bf-home-search-form-submit > div > div > button');
            if (submitButton) {
                submitButton.click();
                submitButton.innerText = "Submitting...";
                submitButton.style.backgroundColor = "#ee5708";
                submitButton.style.borderColor = "#a43c06";
            }

            // Disable all input fields
            document.querySelectorAll('input').forEach(input => {
                input.disabled = true;
            });
        } else {
            console.log('not submitting.', !otherInputInteracted, isValidISBN(event.target.value));
        }
    };

    // Function to handle interaction with other inputs
    const handleOtherInputChange = () => {
        otherInputInteracted = true;
    };

    window.addEventListener('load', () => {
        const inputBox = document.getElementById('bfs_isbn');
        if (inputBox) {
            // Set focus on the ISBN input box
            inputBox.focus();
            // Add event listener for input changes on ISBN input
            inputBox.addEventListener('input', handleISBNInputChange);
        }

        // Add event listeners to all other input elements
        document.querySelectorAll('input').forEach(input => {
            if (input.id !== 'bfs_isbn') {
                input.addEventListener('input', handleOtherInputChange);
            }
        });
    });
})();