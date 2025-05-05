document.addEventListener('DOMContentLoaded', () => {
    const recipeForm = document.getElementById('recipe-form');
    const recipeList = document.getElementById('recipe-list');
    const searchInput = document.getElementById('search-input');
    const modal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-recipe-content');
    const closeBtn = document.querySelector('.close');
    
    // Load recipes and ensure image URLs are properly restored
    let recipes = [];
    try {
        const savedRecipes = localStorage.getItem('recipes');
        recipes = savedRecipes ? JSON.parse(savedRecipes) : [];
    } catch (error) {
        console.error('Error loading recipes:', error);
        recipes = [];
    }

    async function saveRecipes() {
        try {
            localStorage.setItem('recipes', JSON.stringify(recipes));
        } catch (error) {
            throw new Error('Failed to save recipes to localStorage');
        }
    }

    function displayRecipes(recipesToShow = recipes) {
        recipeList.innerHTML = '';
        recipesToShow.forEach((recipe, index) => {
            const recipeItem = createRecipeElement(recipe, index);
            recipeList.appendChild(recipeItem);
        });
    }

    function createRecipeElement(recipe, index) {
        const recipeItem = document.createElement('div');
        recipeItem.classList.add('recipe-item');
        
        // Check if imageUrl exists and is not null/empty
        const imageHtml = recipe.imageUrl ? 
            `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="recipe-image">` : 
            '<div class="no-image">No Image Available</div>';
            
        recipeItem.innerHTML = `
            ${imageHtml}
            <h3>${recipe.name}</h3>
            <button class="view-button">View Details</button>`;

        const viewButton = recipeItem.querySelector('.view-button');
        viewButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showRecipeDetails(recipe);
        });

        return recipeItem;
    }

    function showRecipeDetails(recipe) {
        const formattedIngredients = recipe.ingredients.replace(/\n/g, '<br>');
        const formattedSteps = recipe.preparationSteps.replace(/\n/g, '<br>');
        
        // Enhanced image handling with validation
        let imageHtml = '<div class="no-image">No Image Available</div>';
        if (recipe.imageUrl && recipe.imageUrl.startsWith('data:image')) {
            imageHtml = `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="recipe-image">`;
        }

        modalContent.innerHTML = '';  // Clear existing content
        const modalHTML = `
            <div class="modal-recipe">
                ${imageHtml}
                <h2>${recipe.name}</h2>
                <div class="recipe-details">
                    <h3>Ingredients:</h3>
                    <p>${formattedIngredients}</p>
                    <h3>Preparation Steps:</h3>
                    <p>${formattedSteps}</p>
                    <p><small>Added on: ${new Date(recipe.dateCreated).toLocaleDateString()}</small></p>
                </div>
            </div>
        `;
        
        modalContent.innerHTML = modalHTML;
        modal.style.display = "block";

        // Verify image loading
        const modalImage = modalContent.querySelector('.recipe-image');
        if (modalImage) {
            modalImage.onerror = () => {
                modalImage.replaceWith(createNoImagePlaceholder());
            };
        }
    }

    function createNoImagePlaceholder() {
        const placeholder = document.createElement('div');
        placeholder.className = 'no-image';
        placeholder.textContent = 'No Image Available';
        return placeholder;
    }

    closeBtn.addEventListener('click', () => {
        modal.style.display = "none";
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function saveRecipe(recipe) {
        try {
            // Ensure imageUrl is properly set even if null
            if (!recipe.imageUrl) {
                recipe.imageUrl = null;
            }
            recipes.push(recipe);
            await saveRecipes();
            displayRecipes();
        } catch (error) {
            alert('Error saving recipe: Storage quota might be exceeded');
            recipes.pop(); // Remove the recipe if saving failed
        }
    }

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredRecipes = recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.toLowerCase().includes(searchTerm)
        );
        displayRecipes(filteredRecipes);
    });

    recipeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const recipeName = document.getElementById('recipe-name').value.trim();
        const ingredients = document.getElementById('ingredients').value.trim();
        const preparationSteps = document.getElementById('preparation-steps').value.trim();
        const image = document.getElementById('image-upload').files[0];

        if (recipeName && ingredients && preparationSteps) {
            const recipe = {
                name: recipeName,
                ingredients,
                preparationSteps,
                imageUrl: null,
                dateCreated: new Date().toISOString()
            };

            if (image) {
                try {
                    // Convert image to Base64 and store it directly
                    const base64Image = await convertImageToBase64(image);
                    recipe.imageUrl = base64Image; // Store the Base64 string
                } catch (error) {
                    alert('Error processing image. Please try again with a smaller image.');
                    return;
                }
            }

            await saveRecipe(recipe);
            recipeForm.reset();
        } else {
            alert('Please fill in all required fields.');
        }
    });

    displayRecipes();
});