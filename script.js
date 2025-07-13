// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzb3jbndemY5w3nkwk-sdIxLmYV0Qj9WQ",
    authDomain: "sahithyotsav-results-288f2.firebaseapp.com",
    databaseURL: "https://sahithyotsav-results-288f2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sahithyotsav-results-288f2",
    storageBucket: "sahithyotsav-results-288f2.firebasestorage.app",
    messagingSenderId: "601783689113",
    appId: "1:601783689113:web:cba8bff9cdc4a1aac43d08"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const initialScreen = document.getElementById('initial-screen');
const getResultsBtn = document.getElementById('get-results-btn');
const chatbotScreen = document.getElementById('chatbot-screen');
const chatArea = document.getElementById('chat-area');
const startButton = document.getElementById('start-button');
// userInput, sendButton എന്നിവ ഒഴിവാക്കി
const backToCategoriesBtn = document.getElementById('back-to-categories-btn'); // പുതിയ ബട്ടൺ

let currentCategory = '';

// ഓട്ടോ ഇമേജ് സ്ലൈഡറിനായുള്ള ചിത്രങ്ങൾ (മുൻപത്തെ കോഡിൽ നിന്ന്)
const adImages = [
    'ad_image1.jpg',
    'ad_image2.jpg',
    'ad_image3.jpg'
];
let currentSlide = 0;
let slideInterval;

// Function to add a message to the chat area with typing animation
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

// Function to show category buttons
function showCategoryButtons() {
    // Back to Categories ബട്ടൺ മറയ്ക്കുക
    backToCategoriesBtn.style.display = 'none';
    // ചാറ്റ് ഏരിയ ക്ലിയർ ചെയ്യുക
    chatArea.innerHTML = '';

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

// Function to handle category selection
function handleCategorySelection(category) {
    addMessage(category, 'user');
    currentCategory = category;
    addMessage(`Please select a program for ${category}:`, 'bot', true, () => {
        showProgramButtons(category);
    });
}

// Function to show program buttons for a given category
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

// Function to handle program selection
function handleProgramSelection(category, program) {
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
                    backToCategoriesBtn.style.display = 'block'; // ചിത്രം വന്നതിന് ശേഷം ബട്ടൺ കാണിക്കുക
                };
                img.onerror = () => {
                    loadingMessageBubble.textContent = "Error loading image.";
                    chatArea.scrollTop = chatArea.scrollHeight;
                    backToCategoriesBtn.style.display = 'block'; // പിശക് വന്നാലും ബട്ടൺ കാണിക്കുക
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
                backToCategoriesBtn.style.display = 'block'; // ചിത്രം ഇല്ലെങ്കിൽ ബട്ടൺ കാണിക്കുക
            }
        } else {
            loadingMessageBubble.textContent = "No results found in Firebase.";
            chatArea.scrollTop = chatArea.scrollHeight;
            backToCategoriesBtn.style.display = 'block'; // ഫലങ്ങൾ ഇല്ലെങ്കിൽ ബട്ടൺ കാണിക്കുക
        }
    }, (error) => {
        loadingSpinner.remove();
        loadingMessageBubble.textContent = 'There was an error loading the image. Please try again later.';
        console.error('Error fetching image URL:', error);
        chatArea.scrollTop = chatArea.scrollHeight;
        backToCategoriesBtn.style.display = 'block'; // പിശക് വന്നാലും ബട്ടൺ കാണിക്കുക
    });
}

// Function to download image
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

// സ്ലൈഡർ ചിത്രങ്ങൾ ലോഡ് ചെയ്യുകയും ഡിസ്പ്ലേ ചെയ്യുകയും ചെയ്യുന്ന ഫംഗ്ഷൻ (മുൻപത്തെ കോഡിൽ നിന്ന്)
function loadSliderImages() {
    const adSlider = document.getElementById('ad-slider');
    const sliderDots = document.getElementById('slider-dots');
    if (!adSlider || !sliderDots) return;

    adSlider.innerHTML = '';
    sliderDots.innerHTML = '';

    adImages.forEach((imageSrc, index) => {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `Ad Image ${index + 1}`;
        adSlider.appendChild(img);

        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateSlider();
            resetSlideInterval();
        });
        sliderDots.appendChild(dot);
    });
}

// സ്ലൈഡർ അപ്ഡേറ്റ് ചെയ്യുന്ന ഫംഗ്ഷൻ (മുൻപത്തെ കോഡിൽ നിന്ന്)
function updateSlider() {
    const adSlider = document.getElementById('ad-slider');
    if (!adSlider || adImages.length === 0) return;

    const firstImage = adSlider.querySelector('img');
    if (!firstImage || firstImage.clientWidth === 0) {
        setTimeout(updateSlider, 50); 
        return;
    }
    const slideWidth = firstImage.clientWidth;
    adSlider.style.transform = `translateX(-${currentSlide * slideWidth}px)`;

    document.querySelectorAll('.dot').forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// അടുത്ത സ്ലൈഡിലേക്ക് പോകുന്ന ഫംഗ്ഷൻ (മുൻപത്തെ കോഡിൽ നിന്ന്)
function nextSlide() {
    currentSlide = (currentSlide + 1) % adImages.length;
    updateSlider();
}

// സ്ലൈഡ് ഇന്റർവൽ റീസെറ്റ് ചെയ്യുന്ന ഫംഗ്ഷൻ (മുൻപത്തെ കോഡിൽ നിന്ന്)
function resetSlideInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 3000);
}


// Event Listeners
getResultsBtn.addEventListener('click', () => {
    initialScreen.classList.remove('active');
    chatbotScreen.classList.add('active');
    clearInterval(slideInterval); // ചാറ്റ്ബോട്ട് സ്ക്രീനിലേക്ക് മാറുമ്പോൾ സ്ലൈഡർ നിർത്തുക
    addMessage("Welcome to the Sahithyotsav Results Bot!", 'bot', true, () => {
        startButton.style.display = 'block'; // സ്റ്റാർട്ട് ബട്ടൺ കാണിക്കുക
        backToCategoriesBtn.style.display = 'none'; // സ്റ്റാർട്ട് ചെയ്യുമ്പോൾ ബാക്ക് ബട്ടൺ മറയ്ക്കുക
    });
});

startButton.addEventListener('click', () => {
    startButton.style.display = 'none'; // സ്റ്റാർട്ട് ബട്ടൺ മറയ്ക്കുക
    showCategoryButtons(); // കാറ്റഗറി ബട്ടണുകൾ കാണിക്കുക
});

// "Back to Categories" ബട്ടണിനായുള്ള ഇവന്റ് ലിസണർ
backToCategoriesBtn.addEventListener('click', () => {
    showCategoryButtons(); // കാറ്റഗറി ബട്ടണുകൾ കാണിക്കാൻ ഫംഗ്ഷൻ വിളിക്കുക (ചാറ്റ് ക്ലിയർ ചെയ്യും, ബട്ടൺ മറയ്ക്കും)
});


// പേജ് ലോഡ് ചെയ്യുമ്പോൾ സ്ലൈഡർ ആരംഭിക്കുക (മുൻപത്തെ കോഡിൽ നിന്ന്)
document.addEventListener('DOMContentLoaded', () => {
    if (adImages.length > 0) {
        loadSliderImages();
        const firstImage = document.querySelector('.ad-slider img');
        if (firstImage) {
            firstImage.onload = () => {
                updateSlider();
                resetSlideInterval();
            };
            if (firstImage.complete) {
                updateSlider();
                resetSlideInterval();
            }
        } else {
            updateSlider();
            resetSlideInterval();
        }
    }
});

// മുൻപുണ്ടായിരുന്ന userInput, sendButton എന്നിവയുടെ ഇവന്റ് ലിസണറുകൾ ഒഴിവാക്കി.
