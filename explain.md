# Universal SaaS Copilot - Interview Preparation & Explanation

## Project Overview
This project is a Universal SaaS Copilot injected into Trello as a Chrome Extension (Manifest V3). It acts as an AI operator that understands the user's SaaS context, plans multi-step actions, executes them through tools, and learns capabilities dynamically from HAR network captures.

## Architecture & Methods Used
1. **Chrome Extension (`apps/extension`)**:
   - **Method**: Built using React 19, TailwindCSS, Vite, and Manifest V3. Injected via a Content Script natively into Trello's DOM as a fixed right sidebar UI.
   - **Why**: React allows for a complex state-driven UI like the chat interface, Plan Viewer, and Execution Timeline. Vite provides fast builds, and TailwindCSS ensures isolated, minimal, and modern styling (matching the #1F1F21 background and #0055CC Trello colors) without conflicting with Trello's CSS.
2. **Agent Backend (`apps/backend`)**:
   - **Method**: Node.js/Express server powered by the Vercel AI SDK, deployed to a serverless environment (Vercel). Streams responses to the frontend using Server-Sent Events (SSE).
   - **Why**: Vercel AI SDK provides a standardized way to handle LLM streaming and tool calls. Node.js/Express is lightweight and natively handles async operations and streams efficiently.
3. **Skills Registry (`packages/skills`)**:
   - **Method**: A universal tool registry with a HAR-to-Skill automation parser. It parses `.har` files to extract requests (method, endpoint, headers, payload structure) and turns them into OpenAPI/JSON schemas for agent tools.
   - **Why**: Hardcoding tools doesn't scale. Generating tools dynamically from network captures allows the system to easily adapt to new SaaS APIs without changing the agent logic.
4. **Authentication Method**:
   - **Method**: Session Auth. The extension sends requests directly from the user's browser, passing the required `VITE_TRELLO_API_KEY` to identify the application, but relying on Trello's existing browser cookies/session for user authentication.
   - **Why**: Eliminates the need for complex OAuth flows or JWT logins. It significantly improves UX (no login required for the copilot) and security (credentials don't leave the browser).

## Key Trade-offs & Decisions
- **LLM Choice (Groq vs. OpenAI)**:
  - *Decision*: Used `llama-3.1-8b-instant` via Groq API instead of OpenAI's `gpt-4o` (as specified in the assignment).
  - *Trade-off*: While GPT-4.1/4o might have better reasoning capabilities out-of-the-box, modern SaaS applications have massive DOM payloads that easily exhaust standard OpenAI free-tier limits. Groq provides 30,000 Tokens Per Minute and lightning-fast inference for free, making it possible to run end-to-end reliably without a paid key. 
  - *Mitigation*: The entire architecture uses the standard `openai` SDK format, meaning swapping back to a paid OpenAI model is a one-line change (`baseURL`).
- **DOM Injection vs. IFrames**:
  - *Decision*: Injected a React root directly into the Trello DOM instead of an IFrame.
  - *Trade-off*: IFrames provide better CSS/JS isolation, but direct DOM injection allows the extension to easily read page context (visible lists, selected cards) and dynamically interact with the page elements. Tailwind helps avoid CSS collisions.
- **Streaming over HTTP/SSE vs. WebSockets**:
  - *Decision*: Used token-by-token streaming via the Vercel AI SDK over standard HTTP instead of WebSockets.
  - *Trade-off*: WebSockets allow bi-directional real-time communication, but streaming over HTTP is simpler to implement over standard serverless endpoints (like Vercel) and perfectly fits the one-way token-by-token streaming requirement of LLM responses.

## Limitations
- **Context Size Constraints**: Even with models supporting large contexts, serializing the entire Trello DOM or all visible elements can quickly hit context limits or cause the LLM to lose focus ("lost in the middle" phenomenon).
- **Tool Brittleness (HAR Parsing)**: Skills generated directly from HAR files are brittle. If Trello changes its API endpoint, payload structure, or authentication mechanism, the generated tool will immediately fail and require a new HAR capture.
- **Security & Scope**: Using the native browser session means the agent has the exact same permissions as the user. If the agent hallucinates a destructive action (like deleting a board), it will execute successfully without a secondary confirmation unless specifically programmed to halt on destructive actions.
- **Cross-Origin Restrictions in MV3**: Manifest V3 imposes strict CORS and execution restrictions, which occasionally complicate injecting robust logic or establishing long-lived connections compared to older extension standards.

## Future Scope
- **Self-Healing Tools**: Instead of relying purely on static HAR generation, the agent could detect when an API call fails and automatically explore the page network traffic to find the updated endpoint and self-heal its own tool definitions.
- **Human-in-the-Loop (HITL) for Destructive Actions**: Implementing an approval workflow inside the chat UI before executing any HTTP DELETE, PUT, or high-risk POST actions.
- **Support for More SaaS Apps**: The architecture is already a "Universal Copilot." Expanding the skills registry to include JIRA, Linear, Notion, or Asana by simply providing their respective HAR files.
- **Multi-modal Capabilities**: Utilizing vision-capable models like GPT-4o to "see" the SaaS UI rather than just relying on text-based DOM extraction, allowing it to interact with canvas-based or heavily obfuscated web apps.

## Problems Faced During Development
- **Managing Manifest V3 Restrictions**: Migrating complex background scripts to MV3 Service Workers required handling aggressive worker termination and ensuring the React state in the Content Script stayed in sync with the backend.
- **DOM Injection Collisions**: Trello uses complex, highly specific CSS. Initially, the injected React UI's styles bled out, and Trello's styles bled in. Using Tailwind's preflight reset and strict scoping was necessary to isolate the Copilot UI.
- **Token Rate Limits**: Initial testing with OpenAI free tiers hit token limits almost instantly due to the size of the DOM context being sent on every request. Switching to Groq was a necessary pivot to ensure stable development and testing without paid API keys.
- **HAR File Parsing Complexities**: HAR files are massive and contain hundreds of background analytics and heartbeat requests. Writing a robust script to filter out the noise and only extract the relevant user-initiated API calls (like POST to `/1/cards`) was challenging.

## Expected Q&A for Interview

**Q1: How does the agent authenticate with Trello to perform actions on my behalf?**
*A: The agent uses your existing browser session. Because the extension runs in the browser context, any network requests it makes to Trello's API automatically include your session cookies. We only use a public Trello API key to identify the app, avoiding any need for OAuth or secondary login flows. This is both secure and provides a seamless user experience.*

**Q2: The assignment specified the OpenAI Agents SDK. Why did you choose Groq?**
*A: I actually did use the OpenAI SDK architecture! However, I pointed the `baseURL` to Groq's API to use their `llama-3.1-8b-instant` model. SaaS contexts can be massive, and processing them quickly burns through the OpenAI free tier limits. Groq's generous free tier and fast inference let the app run reliably without requiring reviewers to supply their own paid API key. Because I stuck to the standard schema, switching to GPT-4o for production is a one-line change.*

**Q3: Explain the HAR-to-Skill parsing workflow.**
*A: Instead of hardcoding API calls, we export a `.har` file of a human manually performing a task (like creating a card) using Chrome DevTools. My parser script reads this file, identifies the relevant Trello API requests, and extracts the HTTP method, endpoint, and payload structure. It maps this into a JSON schema that the Agent SDK understands as a "Tool". This architecture allows us to add new capabilities to the agent simply by recording a browser session.*

**Q4: How did you handle UI injection into Trello without breaking their layout?**
*A: The extension uses a Content Script to create a new generic container (`div`) and appends it to the `body`. I render the React app inside this container and position it fixed to the right side to act as a sidebar. I utilized TailwindCSS because it scopes styles well and ensures our minimal styling doesn't bleed into or break Trello's global CSS, while intentionally picking colors like `#1F1F21` and `#0055CC` to match Trello's aesthetic.*

**Q5: What happens if a tool execution fails? How does the agent recover?**
*A: The tool execution engine wraps calls in try-catch blocks and always returns a standardized response schema containing `{ success: false, message, data }` rather than throwing an unhandled exception. The agent SDK receives this failure context. The system prompt strictly instructs the agent to read the error, avoid fabricating a successful execution, and instead explain the failure to the user or try an alternative approach.*

**Q6: Why deploy the backend to Vercel?**
*A: Vercel is optimized for frontend-adjacent APIs and integrates seamlessly with the Vercel AI SDK for streaming responses. A serverless architecture abstracts away server maintenance, scales instantly, and is highly cost-effective for stateless agent operations like receiving context, planning, and streaming tokens back to the extension.*
