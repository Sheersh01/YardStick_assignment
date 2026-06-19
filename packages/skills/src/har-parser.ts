import fs from 'fs';
import path from 'path';

export interface HarEntry {
  request: {
    method: string;
    url: string;
    postData?: {
      text: string;
    };
  };
}

export interface HarData {
  log: {
    entries: HarEntry[];
  };
}

export function parseHar(harFilePath: string, outputFilePath: string) {
  try {
    const rawData = fs.readFileSync(harFilePath, 'utf8');
    const har: HarData = JSON.parse(rawData);

    const generatedSkills: any[] = [];

    let skillIndex = 1;

    for (const entry of har.log.entries) {
      const url = new URL(entry.request.url);

      // Only care about Trello API calls
      if (!url.hostname.includes('trello.com') || !url.pathname.startsWith('/1/')) {
        continue;
      }

      // Ignore basic polling or generic fetches if they are GETs (unless we want them)
      // We mainly want POST/PUT for actions.
      if (entry.request.method === 'OPTIONS') {
        continue;
      }

      // We can generate a basic schema from the URL and payload
      let parameters: any = { type: 'object', properties: {}, required: [] };

      if (entry.request.postData && entry.request.postData.text) {
        try {
          const body = JSON.parse(entry.request.postData.text);
          for (const key of Object.keys(body)) {
            parameters.properties[key] = { type: typeof body[key], description: `Parameter ${key}` };
          }
        } catch (e) {
          // ignore non-json
        }
      }

      // Extract path variables conceptually (e.g. /1/cards/12345 -> /1/cards/{id})
      // For this simple script, we just register the exact path or a genericized one.
      const pathParts = url.pathname.split('/');
      let genericPath = url.pathname;
      if (pathParts.length > 3 && pathParts[3].length > 10) {
        // likely an ID
        genericPath = `/${pathParts[1]}/${pathParts[2]}/{id}` + (pathParts[4] ? `/${pathParts.slice(4).join('/')}` : '');
        parameters.properties['id'] = { type: 'string', description: 'ID' };
        parameters.required.push('id');
      }

      // Avoid duplicates
      if (generatedSkills.some((s) => s.endpoint === genericPath && s.method === entry.request.method)) {
        continue;
      }

      generatedSkills.push({
        id: `auto-skill-${skillIndex++}`,
        name: `${entry.request.method.toLowerCase()}_${pathParts[2] || 'action'}`,
        description: `Automatically generated skill for ${genericPath}`,
        endpoint: genericPath,
        method: entry.request.method,
        parameters
      });
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(generatedSkills, null, 2));
    console.log(`✅ Successfully generated ${generatedSkills.length} skills to ${outputFilePath}`);
  } catch (error) {
    console.error('Error parsing HAR file:', error);
  }
}

// If run directly from CLI
if (require.main === module) {
  const harPath = process.argv[2];
  if (!harPath) {
    console.error('Usage: ts-node har-parser.ts <path-to-har-file>');
    process.exit(1);
  }
  
  const resolvedHarPath = path.resolve(harPath);
  const outPath = path.resolve(__dirname, 'generated-skills.json');
  parseHar(resolvedHarPath, outPath);
}
