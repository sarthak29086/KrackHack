import React, { useState } from "react";
import axios from "axios";
import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = "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";
const GITHUB_USERNAME = "sarthak29086"; // Your GitHub username

const AmplifierApp = () => {
  const [userInput, setUserInput] = useState("");
  const [deployedSite, setDeployedSite] = useState(""); // Stores the GitHub Pages link
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetches a specification from Amplifier Agent
  const fetchSpecification = async () => {
    if (!userInput.trim()) {
      alert("Please enter a web application idea.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "https://api-lr.agent.ai/v1/agent/sz36tff8ztkgxxy7/webhook/3fdff382",
        { user_input: userInput },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Amplifier Agent Response:", response.data);
      sendToAgent2(response.data);
    } catch (err) {
      setError("Error fetching specification from Amplifier Agent.");
      console.error("Error:", err);
      setLoading(false);
    }
  };

  // Sends JSON Spec to Agent 2 and extracts multiple HTML pages
  const sendToAgent2 = async (jsonData) => {
    try {
      const response = await axios.post(
        "https://api-lr.agent.ai/v1/agent/j26ct5lod6vb0ydn/webhook/0892fa0a",
        { user_input: JSON.stringify(jsonData) },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Agent 2 JSON Response:", response.data);

      const mainHtml = response.data?.response?.html || "";  // <-- FIXED
      const pages = response.data?.response?.pages || [];   // <-- FIXED

      if (!mainHtml.trim().startsWith("<!DOCTYPE html>")) {
        throw new Error("Agent 2 did not return a valid HTML file.");
      }

      // Convert pages to HTML by sending them to Agent 3
      const pagesHtml = await generatePagesHtml(pages);

      // Push to GitHub
      const repoName = `generated-website-${Date.now()}`;
      const siteUrl = await createGitHubRepoAndPush(repoName, mainHtml, pagesHtml);
      setDeployedSite(siteUrl);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sends each page spec to Agent 3 to get HTML
  const generatePagesHtml = async (pages, allLinks) => {
    const pagesHtml = {};

    for (const page of pages) {
        try {
            const response = await axios.post(
                "https://api-lr.agent.ai/v1/agent/dzd613g2nebxdk1g/webhook/0ae78b9f",
                { 
                    user_input: page,  // Send the page details as user_input (no need for JSON.stringify)
                    all_links: allLinks // Include the full navigation links list
                },
                { headers: { "Content-Type": "application/json" } }
            );

            // 🔍 Log Agent 3's response to debug
            console.log(`Agent 3 Response for ${page.id}:`, response.data);

            const pageHtml = response.data?.response?.html || "";
            if (pageHtml.trim().startsWith("<!DOCTYPE html>")) {
                pagesHtml[`${page.id}.html`] = pageHtml;
            } else {
                console.warn(`Agent 3 did not return valid HTML for ${page.id}`);
            }
        } catch (error) {
            console.error(`Error generating page ${page.id}:`, error);
        }
    }

    return pagesHtml;
};


  // Pushes multiple HTML files to GitHub and enables GitHub Pages
  const createGitHubRepoAndPush = async (repoName, mainHtml, pagesHtml) => {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
      // Step 1: Create a new GitHub repository
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: false,
        description: "Auto-generated website",
      });
      console.log(`✅ Created repo: ${repoName}`);

      // Step 2: Push an initial README file
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_USERNAME,
        repo: repoName,
        path: "README.md",
        message: "Initial commit - Setting up main branch",
        content: btoa("# Auto-Generated Website\nThis site was generated automatically."),
        branch: "main",
        committer: { name: "GitHub Bot", email: "bot@example.com" },
        author: { name: "GitHub Bot", email: "bot@example.com" },
      });
      console.log(`✅ Pushed initial commit to 'main' branch`);

      // Step 3: Push index.html
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_USERNAME,
        repo: repoName,
        path: "index.html",
        message: "Added index.html",
        content: btoa(unescape(encodeURIComponent(mainHtml))),
        branch: "main",
        committer: { name: "GitHub Bot", email: "bot@example.com" },
        author: { name: "GitHub Bot", email: "bot@example.com" },
      });
      console.log(`✅ Uploaded index.html`);

      // Step 4: Push additional pages
      for (const [filename, content] of Object.entries(pagesHtml)) {
        await octokit.repos.createOrUpdateFileContents({
          owner: GITHUB_USERNAME,
          repo: repoName,
          path: filename,
          message: `Added ${filename}`,
          content: btoa(unescape(encodeURIComponent(content))),
          branch: "main",
          committer: { name: "GitHub Bot", email: "bot@example.com" },
          author: { name: "GitHub Bot", email: "bot@example.com" },
        });
        console.log(`✅ Uploaded ${filename}`);
      }

      // Step 5: Enable GitHub Pages
      await octokit.repos.update({
        owner: GITHUB_USERNAME,
        repo: repoName,
        default_branch: "main",
      });

      await octokit.repos.createPagesSite({
        owner: GITHUB_USERNAME,
        repo: repoName,
        source: {
          branch: "main",
          path: "/",
        },
      });
      console.log(`✅ Enabled GitHub Pages`);

      return `https://${GITHUB_USERNAME}.github.io/${repoName}/`;
    } catch (err) {
      setError("Error deploying to GitHub Pages.");
      console.error("❌ GitHub API Error:", err);
      throw err;
    }
  };

  return (
    <div style={styles.container}>
      <h1>Amplifier Web App Generator</h1>
      <textarea
        style={styles.textarea}
        placeholder="Describe your web application idea..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
      />
      <button style={styles.button} onClick={fetchSpecification} disabled={loading}>
        {loading ? "Generating..." : "Generate Web App"}
      </button>

      {error && <p style={styles.error}>{error}</p>}

      {deployedSite && (
        <div style={styles.box}>
          <h3>✅ Website Deployed!</h3>
          <p>
            <a href={deployedSite} target="_blank" rel="noopener noreferrer">
              View Website
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

// Basic Styles
const styles = {
  container: {
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    minHeight: "100vh",
    backgroundImage: "url('/The_background.jpg')", // Replace with your image file path
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    color: "white",
  },
  textarea: {
    width: "80%",
    maxWidth: "600px",
    height: "100px",
    margin: "10px auto",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px",
    resize: "vertical",
    display: "block",
  },
  button: {
    display: "block",
    width: "50%",
    margin: "10px auto",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  error: {
    color: "red",
    marginTop: "10px",
  },
  box: {
    backgroundColor: "#eee",
    padding: "15px",
    marginTop: "10px",
    borderRadius: "5px",
    textAlign: "center",
  },
};

export default AmplifierApp;
