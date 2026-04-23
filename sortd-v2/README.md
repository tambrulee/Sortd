# What is Sort'd?

Sort'd is a simple web application which allows the user to create a list which saves to their cache using local storage. It's intended for every day casual use and therefore was intended to be user-friendly and easy to use with basic functions.

It is limited to being used on one device on a time as it relies on the cache for local storage. 

I have chosen to have no navigation on the website as I felt it wasn't necessary for functionality. The landing page welcomes the user and gives a brief intro to the web app and guides them on how to use it.  

Main features include:

* List Page
* How to instructions
* Ability to change window tab name
* Drag and drop
* Add new task
* Hide checked items
* Change background
* Current time

---

## Development Cycle

This project followed a clear development cycle, which is documented through structured GitHub commits and this README.

---

### 1. Planning & Setup
- Created a wireframe and decided on key features (task creation, editing, deletion, drag-and-drop, hide completed)
- Set up the project structure using HTML, SCSS, and JavaScript
- Initialized Git and started version control from the beginning


###  2. Feature Development
- Built core task functionality (add, delete, edit)
- Implemented drag-and-drop reordering using native HTML5 API
- Added persistent storage via 'localStorage'
- Introduced toggle to hide/show completed tasks
- Developed a welcome pop-up using conditional rendering via 'localStorage'

Each feature was developed and tested in isolation before being integrated.


### 3. Testing & Debugging
- Manual testing was applied throughout development 
- Issues like file path errors, non-working toggles, and DOM misreferences were identified and fixed
- Used console logging, DOM inspection, and functional walkthroughs for each component


### 4. Styling & Responsiveness
- Used Bootstrap for responsive layout
- Customized components with SCSS variables
- Ensured the UI worked on different screen sizes through browser testing


### 5. Deployment
- Deployed using GitHub Pages
- Verified that deployed version matched the development version
- Final testing done post-deployment to ensure functionality and layout remained consistent


### 6. Git Commit History
The GitHub repository includes meaningful commit messages to track each stage of the project — from initial setup to final deployment. Each commit describes what was added, fixed, or updated to maintain transparency and clarity during the development process.


## Testing

Throughout this project I have tested the code, functionality and responsiveness of the app. There are two main types of testing:

* Manual testing involves going through the software step by step as a user would, checking things like layout, functionality, and how intuitive everything feels. It relies on human instinct, observation, and logic—especially useful when you're exploring a new feature or doing something that doesn’t follow a rigid pattern. I’d use manual testing for UI/UX checks, early-stage features that are still changing, or when you just need to quickly confirm something without setting up a whole testing framework.

* Automated testing is great for catching bugs in code you’ve already written and want to keep stable. It uses tools and scripts to run tests automatically, which saves loads of time when you’re dealing with larger projects or pushing regular updates. It’s especially useful for regression testing, performance testing, and anything tied into a CI/CD pipeline. Once the tests are written, they can be reused over and over again with minimal effort—ideal for repeatable tasks and spotting issues before they go live.

Since this is a small, one-off project, I’ve decided to use manual testing. It didn’t make sense to spend time setting up automated tests for something lightweight and not expected to scale. My approach involved going through each feature one by one, testing various scenarios to make sure everything worked as intended. For example, checking whether certain functions would apply to newly created tasks and not just the default ones, ensuring the app behaves consistently regardless of when or how a task is added.

## User Stories

* As a user, I want to add tasks to my to-do list, so that I can keep track of what I need to do.

* As a user, I want to tick off completed tasks, so that I can visually see what I’ve finished.

* As a user, I want to drag and drop tasks, so that I can prioritise or reorder them easily.

* As a user, I want to remove tasks from my list, so that I can keep my to-do list clean and relevant.

* As a user, I want to be able change the page background, so that I can customise or add a theme to my list.

* As a user, I want my tasks to stay saved even after I close the tab, so that I don’t lose progress (via localStorage).

* As a user, I want to navigate the to-do list easily on desktop and mobile, so I can use it wherever I am.

### UX Testing

* [Pop up shows to first time users only](assets/images/README/pop-up.png)

* [Control Panel](assets/images/README/ctrl_panel.png) allows user to add, hide and change background.


* [Tasks](assets/images/README/add_task.png) can be added from the panel.


* Buttons can be used to toggle between [edit](assets/images/README/readonly.png) & [save](assets/images/README/edit.png)


* [Checkboxes can be selected](assets/images/README/checked_list.png) by user and  [hidden by user](assets/images/README/unchecked_list.png) via one button toggle feature


*  [Tasks can be dragged and dropped](assets/images/README/reordered_list.png) into custom order


* [Background can be changed](assets/images/README/change_bg.png) with images from local documents.

* [Validation - Only image file types can be selected for a background](assets/images/README/img-validation.png)

* [The list name can be changed](assets/images/README/change_tab_name.png) and automatically updates the window tab to reflect the user input to make finding the list easier when multiple tabs are open.

#### Tests Run - Desktop

| Test     | Expected Outcome |Outcome Achieved? (Y/N)|
| ----------- | ----------- |----------- |
| 1st Time User - Pop Up    | Pop up greeting user and explaining how the app works pops up when a first time user arrives on the website      |Y|
| Returning User - No Pop Up    | Pop up does not appear when a returning user arrives on the website      |Y|
| Time and Date     | Time and date updates to current time on desktop      |Y|
| Add Task     | Add button creates a new task to the bottom of the list       |Y|
| Edit/Save Buttons - List | Toggles input so that text can be input and then saved to list container       |Y|
| Edit/Save Buttons - Tasks | Toggles input so that text can be input and then saved to task container        |Y|
| Hide/Unhide Button - Existing Task | Toggles hide/unhide button and simultaneously hides any existing tasks which have a checkbox selected        |N - Please see bottom of README for known bugs|
| Hide/Unhide Button - New Tasks | Toggles hide/unhide button and simultaneously hides any new tasks which have a checkbox selected        |N - Please see bottom of README for known bugs|
| Delete Button | When clicked deletes the task        |Y|
| Change background Button | Prompts a local documents window to open and allows user to select image to upload as a background       |Y|
| Change background - Image validation | Ensures the user can only select image file types       |Y|
| Learn More button | When clicked, opens up a popover which gives the user some instructions on using the app        |Y|

#### Tests Run - Mobile/Tablet (Touchscreen)

All of these tests were performed on a touchscreen device

| Test     | Expected Outcome |Outcome Achieved? (Y/N)|
| ----------- | ----------- |----------- |
| Add Task - Mobile     | Add button creates a new task to the bottom of the list       |Y|
| Edit/Save Buttons - List  - Mobile | Toggles input so that text can be input and then saved to list container       |Y|
| Edit/Save Buttons - Tasks  - Mobile | Toggles input so that text can be input and then saved to task container        |Y|
| Hide/Unhide Button - Existing Task | Toggles hide/unhide button and simultaneously hides any existing tasks which have a checkbox selected        |N - Please see bottom of README for known bugs|
| Hide/Unhide Button - New Tasks | Toggles hide/unhide button and simultaneously hides any new tasks which have a checkbox selected        |N - Please see bottom of README for known bugs|
| Delete Button | When clicked deletes the task        |Y|
| Change background Button | Prompts a local documents window to open and allows user to select image to upload as a background       |Y|
| Change background - Image validation | Ensures the user can only select image file types       |Y|
| Learn More button | When clicked, opens up a popover which gives the user some instructions on using the app        |Y|

## Bug Testing & Fixes

I tested my code throughout development and documented each fix through GitHub commits. Below are some of the main bugs I encountered, the tests I carried out, and how I resolved each issue through manual testing:

---

### [GitHub Deployment](assets/images/README/bug-testing-deployment.png)

- **Problem:** Background image wasn’t displaying on the deployed GitHub site  
- **Tests:**  
  - Inspected the browser console for 404 errors  
  - Compared local file paths to GitHub deployment  
  - Tested different relative and absolute paths  
- **Solution:** Removed the forward slash from the image path in the JS file so the relative path resolved correctly on GitHub Pages

---

### [Theme Change](assets/images/README/bug-testing-pic-bg.png)

- **Problem:** File upload button (for changing background) wasn’t triggering the file window in browser  
- **Tests:**  
  - Checked that the file input element existed in the DOM  
  - Verified that the 'id' used in JavaScript matched the HTML  
  - Tried logging clicks and inspecting event listeners  
- **Solution:** Corrected the 'id' being targeted in the JS file to match the input element's ID in the HTML

---

### [Redirect & First-Time User Pop-Up](assets/images/README/bug-testing-redirect.png)

- **Problem:** Redirect logic wasn’t working — it couldn’t detect whether a user was visiting for the first time  
- **Tests:**  
  - Used 'localStorage' to test state persistence  
  - Cleared browser cache/localStorage between sessions to simulate first-time users  
  - Console-logged logic flow and pop-up triggers  
- **Solution:** Added a pop-up to 'index.html' and used JavaScript to check for a flag in 'localStorage'. If not found, the pop-up would show and the flag would be set to avoid showing again on return visits

---

### [Toggle Hide/Unhide Tasks](assets/images/README/bug-testing-toggle.png)

- **Problem:** The toggle button for hiding completed tasks didn’t work and wasn’t persisting the checked state  
- **Tests:**  
  - Compared working vs non-working commits  
  - Verified that 'localStorage' was saving the checked state correctly  
  - Inspected checkbox event listeners and button click behavior  
- **Solution:** Recovered working code from an earlier commit. Then, I separated the toggle logic into its own file ('toggle-done.js') and linked it in the HTML to ensure better separation of concerns and maintainability

---


## Wireframes

I focused my wireframes on functionality. My intention from the outset was to use Bootstrap and SCSS for the overall design. Note: I choose to use SCSS over CSS as I prefer having the ability to create variables in my work. 

[Click here to view wireframes - 1 (Outlines functionality)](assets/images/README/wireframes-1.png)

[Click here to view wireframes - 2 (Outlines website layout and style)](assets/images/README/wireframes-2.png)

I had some rough ideas on how I wanted the website to look which was modern and user-friendly. The decision not to include a navigation was made from the start as it was intended to be one page. I knew that I wanted the user to be able to add, move and list items. The changing background feature was also a priority in terms of functionality and design to make the app customisable. I considered other features including the toggle between editing and saving input, also the save on keying 'Enter' which made their way into the final project. The idea to have the list name also update the document title on the HTML came later - an app called Notion has a similar feature and I thought it was a good UX design idea to help the user easily identify their open tab in the browser.

Designing the web app as one page presented some challenges. Since I wasn't going to have any other pages, I needed a way to communicate what the app does to the user without overwhelming the layout. This led to the later additions of the pop-up which is designed only to show to first-time users. Initially, I thought about having a landing page and creating conditions to redirect returning users to the main list, but this proved to be time-consuming and I found the pop-up easier to set-up and control with JS. I also added a popover from the Bootstrap toolkit so that the user can refer back to the same information that appears on the first-time user pop-up.

Overall, I think that the final design is close to the original wireframes although final design choices such as having certain buttons as a panel have made a big difference to the look and feel of the app. In terms of mobile-responsiveness the app ticks all the boxes and the generated image from [Am-I-Responsive](assets/images/README/am-i-responsive.png) demonstrates usability across platforms.

## Github Deployment

My preferred method of deploying projects to GitHub is via Codespaces in VSCode.

1. I already had Codespaces installed in GitHub, so I went ahead and opened up a new folder in my local documents.
2. I started a new Codespace for my projects and wrote up my first files.
3. I committed my first few files and pushed them to GitHub.
[Installed Codespaces](assets/images/README/codespaces-git-vs.png)
4. From VS Code I am now able to commit, push and pull from the Git Hub panel tool.
[VS Code - Github panel](assets/images/README/vs-gitcontrols.png)
5. I checked in GitHub and confirmed the project had been correctly set up and my first push was in GitHub.
[Live code in Github](assets/images/README/github-code.png)
6. Next, I went to Pages for the project in GitHub. I checked the page was made public, then deployed from the main / root folder.
[Github delpoyment via pages](assets/images/README/github-deploy-pgs.png)
7. Final check was to follow the live link produced by GitHub and check web app is displaying as expected which I confirmed.
[Project deployed via Github](assets/images/README/git-deploy-final.png)

## Other Testing

### 404 Testing
[404 Testing](assets/images/README/404-testing.png)

### HTML
Validator: https://validator.w3.org/detailed.html


1. Error message about trailing slash
* Solution: removed all forward slashes from end tags
[Trailing Slash](assets/images/README/html-trailing-slash.png)

2. Too many descendants within label tag
*  Solution: remove labels surrounding the relevant descending tags
[Labels](assets/images/README/html-labels.png)

3. Too many descendants within label tag
*  Solution: closed div
[Unclosed div](assets/images/README/html-unclosed-div.png)

4. All HTML errors fixed
[HTML - No errors](assets/images/README/html-no-errors.png)

### CSS
Validator: https://jigsaw.w3.org/css-validator/#validate_by_input


[CSS Test - No Errors](assets/images/README/css-no-errors.png)


### JS

[ES Linter](assets/images/README/eslinter.png)
* Unused variables
Solution: removed from code

[ES Linter](assets/images/README/eslinter-2.png)
* Both JS files passed ESLinter

### Lighthouse

* Excellent results for accessability and performance on both mobile and desktop

[Lighthouse - Mobile](assets/images/README/lighthouse-mobile.png)
[Lighthouse - Desktop](assets/images/README/lighthouse-desktop.png)

## Dependencies

### Bootstrap
* Popovers
* Navigation & Footer
* Flexible/responsive containers

### Font Awesome
* Trash, Edit, Save, Hide, Unhide, Change Theme buttons

### Drag and Drop API

* https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API

### W3

* On-click event
https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_onclick_dom

* Duplicating task box
https://www.w3schools.com/jsref/met_node_clonenode.asp

## Unresolved Known Bugs

* Text input does not auto-adjust size of the task box and does not show beyond two lines unless the user selects edit.

* Hide/Unhide button - has broken multiple times despite several patches and fixes. Lastest bug not resolved.