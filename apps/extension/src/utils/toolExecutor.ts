// This layer is responsible for executing tools within the context of the user's browser.
// Since Trello uses session cookies, standard fetch() requests will automatically include them.

import { registry } from 'skills/skill-registry';

export async function executeTool(name: string, args: any): Promise<any> {
  const skill = registry.getSkill(name);
  
  if (!skill) {
    return { success: false, message: `Skill ${name} not found in registry.` };
  }

  try {
    const endpoint = skill.endpoint.startsWith('http') 
      ? skill.endpoint 
      : `https://trello.com${skill.endpoint}`;

    let finalEndpoint = endpoint;
    
    // Inject the current Board ID from the URL if the endpoint requires it
    if (finalEndpoint.includes('{boardId}')) {
      const boardId = window.location.pathname.split('/')[2];
      finalEndpoint = finalEndpoint.replace('{boardId}', boardId);
    }
    
    // Replace URL parameters if any (e.g. {id})
    if (args) {
      for (const [key, value] of Object.entries(args)) {
        if (finalEndpoint.includes(`{${key}}`)) {
          finalEndpoint = finalEndpoint.replace(`{${key}}`, value as string);
          delete args[key];
        }
      }
    }

    const url = new URL(finalEndpoint);

    // Trello web client also appends token to URL sometimes, but cookies handle auth.
    const token = window.localStorage.getItem('token');
    if (token) {
      url.searchParams.append('token', token);
    }

    // If GET request, append remaining args to URL
    if (skill.method === 'GET' && args) {
      for (const [key, value] of Object.entries(args)) {
        url.searchParams.append(key, value as string);
      }
    }

    // Fetch the dsc (CSRF) token from the background script
    const dscToken = await new Promise<string | null>((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_DSC_COOKIE' }, (res) => resolve(res?.dsc));
    });

    const requestOptions: RequestInit = {
      method: skill.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include' // Ensures the active session cookies are sent natively!
    };

    if (skill.method !== 'GET') {
      const payload = { ...args };
      // Inject dsc token into the body payload! This is Trello's native CSRF mechanism.
      if (dscToken) {
        payload.dsc = dscToken;
      }
      requestOptions.body = JSON.stringify(payload);
    }

    const res = await fetch(url.toString(), requestOptions);
    const text = await res.text();
    
    if (!res.ok) {
       return { success: false, message: `Request failed with status ${res.status}: ${text}` };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return { success: true, message: 'Action executed successfully.', data };
    
  } catch (error: any) {
    console.error(`[Tool Execution Error] ${name}:`, error);
    return { success: false, message: error.message || 'Unknown error occurred during execution' };
  }
}
