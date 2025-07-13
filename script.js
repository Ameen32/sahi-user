// Firebase Configuration (Keep this as is)
const firebaseConfig = {
    apiKey: "AIzaSyAzb3jbndemY5w3nkwk-sdIxLmYV0Qj9WQ",
    authDomain: "sahithyotsav-results-288f2.firebaseapp.com",
    databaseURL: "https://sahithyotsav-results-288f2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sahithyotsav-results-288f2",
    storageBucket: "sahithyotsav-results-288f2.firebasestorage.app",
    messagingSenderId: "601783689113",
    appId: "1:601783689113:web:cba8bff9cdc4a1aac43d08"
};

// Initialize Firebase (Keep this as is)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const initialScreen = document.getElementById('initial-screen');
const getResultsBtn = document.getElementById('get-results-btn');
const chatbotScreen = document.getElementById('chatbot-screen');
const chatArea = document.getElementById('chat-area');
const startButton = document.getElementById('start-button');

// Remove userInput and sendButton as they are no longer needed
// const userInput = document.getElementById('user-input');
// const sendButton = document.getElementById('send-button');

// New: Get the back to category button
const backToCategoryBtn = document.getElementById('back-to-category-btn');
const inputContainer = document.querySelector('.input-container'); // Assuming you have a container for input/buttons

let currentCategory = '';

function addMessage(text, sender, isTyping = false, callback = null, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    messageDiv.appendChild(bubble);
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    if (isTyping) {
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                bubble.textContent += text.charAt(i);
                i++;
                chatArea.scrollTop = chatArea.scrollHeight;
            } else {
                clearInterval(typingInterval);
                if (callback) callback();
            }
        }, 30);
    } else {
        if (isHtml) {
            bubble.innerHTML = text;
        } else {
            bubble.textContent = text;
        }
        chatArea.scrollTop = chatArea.scrollHeight;
        if (callback) callback();
    }
    return bubble;
}

function showCategoryButtons() {
    // Hide the back to category button when showing categories
    backToCategoryBtn.style.display = 'none';
    addMessage("Please select a category to view results.", 'bot', true, () => {
        console.log("Attempting to fetch categories from Firebase 'results' path...");
        database.ref('results').once('value', (snapshot) => {
            if (snapshot.exists()) {
                const allResults = snapshot.val();
                console.log("All results fetched:", allResults);

                const uniqueCategories = new Set();
                for (let key in allResults) {
                    if (allResults.hasOwnProperty(key) && allResults[key].category) {
                        uniqueCategories.add(allResults[key].category);
                    }
                }

                const categoryNames = Array.from(uniqueCategories);
                console.log("Unique Categories found:", categoryNames);

                if (categoryNames.length > 0) {
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.classList.add('category-buttons', 'message', 'bot');

                    categoryNames.forEach(category => {
                        const button = document.createElement('button');
                        button.textContent = category;
                        button.addEventListener('click', () => handleCategorySelection(category));
                        buttonsContainer.appendChild(button);
                    });
                    chatArea.appendChild(buttonsContainer);
                    chatArea.scrollTop = chatArea.scrollHeight;
                } else {
                    console.log("No unique categories found in 'results' path.");
                    addMessage("Sorry, no categories found at the moment.", 'bot');
                }
            } else {
                console.log("No data found in Firebase at 'results' path.");
                addMessage("Sorry, no results found at the moment.", 'bot');
            }
        }, (error) => {
            console.error("Error fetching results for categories:", error);
            addMessage("There was an error loading categories. Please try again later.", 'bot');
        });
    });
}

function handleCategorySelection(category) {
    addMessage(category, 'user');
    currentCategory = category;
    addMessage(`Please select a program for ${category}:`, 'bot', true, () => {
        showProgramButtons(category);
    });
}

function showProgramButtons(category) {
    database.ref('results').once('value', (snapshot) => {
        if (snapshot.exists()) {
            const allResults = snapshot.val();
            const uniquePrograms = new Set();

            for (let key in allResults) {
                if (allResults.hasOwnProperty(key) && allResults[key].category === category && allResults[key].program) {
                    uniquePrograms.add(allResults[key].program);
                }
            }

            const programNames = Array.from(uniquePrograms);
            console.log(`Unique Programs for ${category}:`, programNames);

            if (programNames.length > 0) {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.classList.add('program-buttons', 'message', 'bot');

                programNames.forEach(program => {
                    const button = document.createElement('button');
                    button.textContent = program;
                    button.addEventListener('click', () => handleProgramSelection(category, program));
                    buttonsContainer.appendChild(button);
                });
                chatArea.appendChild(buttonsContainer);
                chatArea.scrollTop = chatArea.scrollHeight;
            } else {
                console.log(`No programs found for category: ${category}`);
                addMessage(`No programs found for ${category} at the moment.`, 'bot');
            }
        } else {
            console.log("No data found in Firebase at 'results' path for programs.");
            addMessage("Sorry, no results found at the moment.", 'bot');
        }
    }, (error) => {
        console.error("Error fetching programs:", error);
        addMessage("There was an error loading programs. Please try again later.", 'bot');
    });
}

async function handleProgramSelection(category, program) {
    addMessage(program, 'user');

    const loadingMessageBubble = addMessage('Loading image...', 'bot', false, null, true);
    const loadingSpinner = document.createElement('div');
    loadingSpinner.classList.add('loading-spinner');
    loadingMessageBubble.appendChild(loadingSpinner);

    database.ref('results').once('value', (snapshot) => {
        loadingSpinner.remove();
        loadingMessageBubble.textContent = '';

        if (snapshot.exists()) {
            const allResults = snapshot.val();
            let imageUrl = null;

            for (let key in allResults) {
                if (allResults.hasOwnProperty(key) && allResults[key].category === category && allResults[key].program === program) {
                    imageUrl = allResults[key].imageUrl;
                    break;
                }
            }

            if (imageUrl) {
                const imageResultDiv = document.createElement('div');
                imageResultDiv.classList.add('image-result');

                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = program;
                img.onload = () => {
                    chatArea.scrollTop = chatArea.scrollHeight;
                    // Show the back to category button after image loads
                    backToCategoryBtn.style.display = 'block';
                };
                img.onerror = () => {
                    loadingMessageBubble.textContent = "Error loading image.";
                    chatArea.scrollTop = chatArea.scrollHeight;
                    // Still show the back button even if image fails to load
                    backToCategoryBtn.style.display = 'block';
                };
                imageResultDiv.appendChild(img);

                const downloadIcon = document.createElement('button');
                downloadIcon.classList.add('download-icon');
                downloadIcon.title = 'Download Image';
                downloadIcon.addEventListener('click', () => downloadImage(imageUrl, program));
                imageResultDiv.appendChild(downloadIcon);

                loadingMessageBubble.appendChild(imageResultDiv);
                chatArea.scrollTop = chatArea.scrollHeight;
            } else {
                loadingMessageBubble.textContent = "Image not found for this program.";
                chatArea.scrollTop = chatArea.scrollHeight;
                // Show the back to category button if no image is found
                backToCategoryBtn.style.display = 'block';
            }
        } else {
            loadingMessageBubble.textContent = "No results found in Firebase.";
            chatArea.scrollTop = chatArea.scrollHeight;
            // Show the back to category button if no results
            backToCategoryBtn.style.display = 'block';
        }
    }, (error) => {
        loadingSpinner.remove();
        loadingMessageBubble.textContent = 'There was an error loading the image. Please try again later.';
        console.error('Error fetching image URL:', error);
        chatArea.scrollTop = chatArea.scrollHeight;
        // Show the back to category button on error
        backToCategoryBtn.style.display = 'block';
    });
}

async function downloadImage(imageUrl, filename) {
    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - Could not fetch image.`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        let fileExtension = 'jpeg';
        if (blob.type.includes('image/png')) {
            fileExtension = 'png';
        } else if (blob.type.includes('image/gif')) {
            fileExtension = 'gif';
        } else if (blob.type.includes('image/webp')) {
            fileExtension = 'webp';
        }

        const urlParts = imageUrl.split('.');
        const lastPart = urlParts[urlParts.length - 1];
        const potentialExt = lastPart.split('?')[0].toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(potentialExt)) {
            fileExtension = potentialExt;
        }

        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${fileExtension}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Failed to download image. Please check your internet connection and try again.');
    }
}

// Event Listeners
getResultsBtn.addEventListener('click', () => {
    initialScreen.classList.remove('active');
    chatbotScreen.classList.add('active');
    addMessage("Welcome to the Sahithyotsav Results Bot!", 'bot', true, () => {
        startButton.style.display = 'block';
    });
});

startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    // Clear chat area before showing categories
    chatArea.innerHTML = '';
    showCategoryButtons();
});

// New: Event listener for the back to category button
backToCategoryBtn.addEventListener('click', () => {
    // Clear chat area and restart the conversation flow
    chatArea.innerHTML = '';
    addMessage("Welcome to the Sahithyotsav Results Bot!", 'bot', true, () => {
        startButton.style.display = 'block';
    });
});
