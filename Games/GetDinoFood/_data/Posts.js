// This script handles fetching, parsing, sorting, and filtering
// of post data from either a JSON or XML file.

// Use a self-invoking function to avoid polluting the global scope
(async function() {
    // --- Configuration ---
    const config = {
        // If you want to use the JSON file, set this to 'example.json'.
        // If you want to use the XML file, set this to 'example.xml'.
        // The code will automatically detect and parse the correct format.
        dataFile: 'posts.xml' 
    };

    // --- DOM Elements ---
    const postContainer = document.getElementById('post-container');
    const tagContainer = document.getElementById('tag-container');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    // --- State Variables ---
    let allPosts = [];
    let displayedPosts = [];
    let allTags = new Set();
    let currentSort = 'date-desc'; // Default sort order
    let currentTag = 'all'; // Default tag filter

    // --- UI Helper Functions ---

    // Show a temporary message to the user
    function showMessage(message, type = 'info') {
        messageBox.classList.remove('hidden', 'bg-yellow-100', 'bg-red-100');
        messageText.textContent = message;
        if (type === 'error') {
            messageBox.classList.add('bg-red-100', 'border-red-500', 'text-red-700');
        } else {
            messageBox.classList.add('bg-yellow-100', 'border-yellow-500', 'text-yellow-700');
        }
    }

    // Hide the message box
    function hideMessage() {
        messageBox.classList.add('hidden');
    }

    // --- Data Parsing Functions ---

    // Parse JSON data from the file content
    function parseJsonData(data) {
        // The JSON structure is a single object with a title, date, etc.
        // We'll wrap it in an array to treat it as a list of posts
        // similar to how the XML is structured.
        // For this example, we're assuming the JSON is a single post object.
        // If the user's JSON was an array of posts, this could be simplified.
        if (Array.isArray(data)) {
            return data;
        } else {
            return [data];
        }
    }

    // Parse XML data from the file content
    function parseXmlData(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const posts = xmlDoc.querySelectorAll('Post');
        const parsedPosts = [];

        posts.forEach(post => {
            const title = post.querySelector('Title')?.textContent || '';
            const date = post.querySelector('Date')?.textContent || '';
            const content = post.querySelector('Content')?.textContent || '';
            
            const tags = [];
            post.querySelectorAll('tags tag').forEach(tag => {
                tags.push(tag.textContent);
            });

            // For images, we can grab the first one if it exists
            const imgElement = post.querySelector('img image');
            const img = imgElement ? {
                src: imgElement.querySelector('src')?.textContent || '',
                alt: imgElement.querySelector('alt')?.textContent || ''
            } : null;

            parsedPosts.push({ title, date, content, img, tags });
        });

        return parsedPosts;
    }

    // Fetch the data from the specified file and handle parsing
    async function fetchData() {
        showMessage('Loading posts...');
        try {
            const response = await fetch(config.dataFile);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const text = await response.text();
            
            // Determine file type based on file extension
            if (config.dataFile.endsWith('.json')) {
                const jsonData = JSON.parse(text);
                allPosts = parseJsonData(jsonData);
            } else if (config.dataFile.endsWith('.xml')) {
                allPosts = parseXmlData(text);
            } else {
                throw new Error('Unsupported file type. Please use .json or .xml.');
            }
            
            // Collect all unique tags
            allPosts.forEach(post => {
                post.tags.forEach(tag => allTags.add(tag));
            });
            
            hideMessage();
            renderTags();
            updatePosts();
        } catch (error) {
            showMessage(`Error: Failed to load data. Make sure '${config.dataFile}' exists in the same directory. ${error.message}`, 'error');
            console.error('Error fetching data:', error);
        }
    }

    // --- Rendering and Event Handling ---

    // Render a single post card
    function renderPost(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post-card bg-white rounded-xl shadow-md overflow-hidden';
        
        let imgHtml = '';
        if (post.img && post.img.src) {
            imgHtml = `<img src="${post.img.src}" alt="${post.img.alt}" class="w-full h-48 object-cover">`;
        }

        const tagButtonsHtml = post.tags.map(tag => 
            `<button class="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors tag-button" data-tag="${tag}">${tag}</button>`
        ).join('');

        postDiv.innerHTML = `
            ${imgHtml}
            <div class="p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${post.title}</h2>
                <p class="text-gray-500 text-sm mb-4">${new Date(post.date).toLocaleDateString()}</p>
                <p class="text-gray-700 mb-4">${post.content}</p>
                <div class="flex flex-wrap gap-2">
                    ${tagButtonsHtml}
                </div>
            </div>
        `;
        return postDiv;
    }

    // Render all posts to the DOM
    function renderPosts(posts) {
        postContainer.innerHTML = ''; // Clear previous posts
        if (posts.length === 0) {
            postContainer.innerHTML = `<p class="col-span-full text-center text-gray-500 text-lg">No posts found with this tag.</p>`;
        } else {
            posts.forEach(post => {
                postContainer.appendChild(renderPost(post));
            });
        }
    }

    // Render the dynamic tag buttons
    function renderTags() {
        // Clear existing buttons except the "All" button
        document.querySelectorAll('.tag-button:not([data-tag="all"])').forEach(btn => btn.remove());

        // Create and append a button for each unique tag
        allTags.forEach(tag => {
            const button = document.createElement('button');
            button.textContent = tag;
            button.className = 'tag-button px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors';
            button.dataset.tag = tag;
            tagContainer.appendChild(button);
        });

        // Set initial active state for "All" button
        document.querySelector('.tag-button[data-tag="all"]').classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
    }

    // Filter and sort the posts based on current state
    function updatePosts() {
        // First, filter by tag
        if (currentTag === 'all') {
            displayedPosts = [...allPosts];
        } else {
            displayedPosts = allPosts.filter(post => post.tags.includes(currentTag));
        }

        // Then, sort by date
        if (currentSort === 'date-asc') {
            displayedPosts.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (currentSort === 'date-desc') {
            displayedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        renderPosts(displayedPosts);
    }

    // --- Event Listeners ---

    // Add event listeners for sorting buttons
    document.getElementById('sort-date-asc').addEventListener('click', () => {
        currentSort = 'date-asc';
        updatePosts();
    });

    document.getElementById('sort-date-desc').addEventListener('click', () => {
        currentSort = 'date-desc';
        updatePosts();
    });

    // Add a single event listener to the tag container for delegation
    tagContainer.addEventListener('click', (event) => {
        const target = event.target.closest('.tag-button');
        if (target) {
            const tag = target.dataset.tag;
            currentTag = tag;
            
            // Update active button styling
            document.querySelectorAll('.tag-button').forEach(btn => {
                btn.classList.remove('bg-blue-500', 'text-white', 'hover:bg-blue-600');
                btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
            });
            target.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
            target.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');

            updatePosts();
        }
    });

    // Initial fetch of data when the script loads
    fetchData();
})();
