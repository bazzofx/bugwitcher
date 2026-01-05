<div>
<img width="1200" height="475" alt="GHBanner" src="https://github.com/bazzofx/bugwitcher/blob/main/public/images/banner.png" />
</div>

# Bug Witcher
**Bug Witcher** is a **Static Code Analysis Tool** designed for bug bounty hunters and security researchers. 
It analyzes JavaScript, TypeScript, HTML, and other source files to uncover dangerous sinks, untrusted flows, and potential security vulnerabilities.

## How it works
It uses AI to breakdown the files and create a data diagram of how the functions, variables, user input, api calls are connecting to each other. Then it creates a mermaid chart and highlight potential vulnerabilities discovered on the files.

The app combines **advanced visualization** with an **AI-assisted code flow audit**, featuring:

- Dynamic **graph visualization** of function call flows.
- Highlighting of risky code snippets with tooltips.
- Real-time **bug orbit and animation effects** during analysis.
- File upload management and character density warnings.
- Security-focused dashboards for sinks, entry points, and findings.

---

## Features

- **Static Code Analysis (SAST)**: Scan files for vulnerabilities without executing the code.
- **Flow Visualization**: Graphical representation of function calls and data flows.
- **Interactive Code Highlighting**: Risky nodes are highlighted with inline explanations.
- **Animated Loading Screen**: Lightning-bug and magnifier animation while auditing.
- **File Upload Management**: Track multiple source files, enforce character limits.
- **Security Summary Panels**: Quick overview of sinks, input sources, and trust boundaries.
- **Responsive Sidebar**: Upload files to perform and analysis summary of the functions.

---




## Run Locally

**Prerequisites:**  Node.js
1. Install dependencies:
   `npm install`
2. Set the `VITE_DEEPSEEK_API_KEY` in [.env.local](.env.local) to your DeepSeek API key
3. Run the app:
   `npm run dev`

   ## Run on Docker
1. Build the image
`docker build -t bugwitcher --build-arg API_KEY=$API_KEY .`
2. Deploy docker instance
`docker run -d --name bugwitcher -p 127.0.0.1:3020:3020 bugwitcher`

