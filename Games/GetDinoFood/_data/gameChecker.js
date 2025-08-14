/**
 * This script handles fetching game data from a JSON file and managing
 * the button click events to update the iframe or redirect to another site.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch the JSON data from the external file.
    // Use try/catch for robust error handling.
    try {
        const response = await fetch('_data/game/verCheck.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const gameData = await response.json();

        // Get references to the buttons and iframe
        const stableBtn = document.getElementById('stableBtn');
        const devBtn = document.getElementById('devBtn');
        const itchBtn = document.getElementById('itchBtn');
        const gameFrame = document.getElementById('gameFrame');

        /**
         * Sets the source URL of the iframe.
         * @param {string} url The URL to load in the iframe.
         */
        function setIframeSrc(url) {
            if (url) {
                gameFrame.src = url;
            } else {
                console.error("The provided URL is null or invalid.");
            }
        }

        // Event listener for the "Stable" button
        stableBtn.addEventListener('click', () => {
            const stableUrl = gameData["Stable"].url;
            setIframeSrc(stableUrl);
        });

        // Event listener for the "Dev" button (using Snapshot data)
        devBtn.addEventListener('click', () => {
            const devUrl = gameData["Snapshot"].url;
            setIframeSrc(devUrl);
        });

        // Event listener for the "Itch" button
        itchBtn.addEventListener('click', () => {
            const itchUrl = gameData["Itch-Stable"].url;
            if (itchUrl) {
                window.open(itchUrl, '_blank'); // Open the URL in a new tab
            } else {
                console.error("Itch.io URL not available.");
            }
        });

        // Set the initial game version to Stable when the page loads
        setIframeSrc(gameData["Stable"].url);

    } catch (error) {
        console.error('Could not fetch game data:', error);
        // Display a message to the user if the data can't be loaded.
        gameFrame.contentDocument.body.innerHTML = '<h1>Error loading game data.</h1><p>Please check the console for more details.</p>';
    }
});
