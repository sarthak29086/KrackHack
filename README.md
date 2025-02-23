is an AI-powered web application generator that takes a user-provided idea and generates a fully functional website. It integrates multiple AI agents to process user input, generate HTML pages, and deploy the website automatically to GitHub Pages.

How to Run the Project
Follow the steps below to set up and run the project on your local machine:

1. Clone the Repository
Open a terminal and run:
git clone https://github.com/sarthak29086/KrackHack.git

2. Navigate to the Project Directory
cd KrackHack

3. Install Dependencies
npm install

4. Start the Application
npm start

Project Structure
The project consists of the following key components:

App.js → The core logic of the application, which:

Manages communication with the three AI agents.
Processes the JSON responses returned by each agent.
Handles the GitHub repository creation and deployment of the generated website.
Logs the progress of website generation (inspectable via browser dev tools).
package.json → Contains project dependencies and scripts required to run the application.

How It Works
The user provides an idea for a web application.
Agent 1 processes the idea and generates a structured specification.
Agent 2 converts the specification into HTML files for different pages.
Agent 3 enhances and finalizes the HTML pages.
The generated files are pushed to a newly created GitHub repository.
The website is deployed automatically via GitHub Pages.
The user receives a link to the live website.
Inspecting Progress
To monitor the website generation process, you can open the browser's developer tools (Inspect → Console) to view logs at each stage of development.
