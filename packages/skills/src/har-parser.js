const fs = require('fs');
const path = require('path');

function parseHar(harFilePath, outputFilePath) {
  try {
    const rawData = fs.readFileSync(harFilePath, 'utf8');
    const har = JSON.parse(rawData);

    const generatedSkills = [];

    let skillIndex = 1;

    for (const entry of har.log.entries) {
      const url = new URL(entry.request.url);

      // Only care about Trello API calls
      if (!url.hostname.includes('trello.com') || !url.pathname.startsWith('/1/')) {
        continue;
      }

      // Ignore OPTIONS
      if (entry.request.method === 'OPTIONS') {
        continue;
      }

      let parameters = { type: 'object', properties: {}, required: [] };

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

      const pathParts = url.pathname.split('/');
      let genericPath = url.pathname;
      if (pathParts.length > 3 && pathParts[3].length > 10) {
        genericPath = `/${pathParts[1]}/${pathParts[2]}/{id}` + (pathParts[4] ? `/${pathParts.slice(4).join('/')}` : '');
        parameters.properties['id'] = { type: 'string', description: 'ID' };
        parameters.required.push('id');
      }

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

if (require.main === module) {
  const harPath = process.argv[2];
  if (!harPath) {
    console.error('Usage: node har-parser.js <path-to-har-file>');
    process.exit(1);
  }
  
  const resolvedHarPath = path.resolve(harPath);
  const outPath = path.resolve(__dirname, 'generated-skills.json');
  parseHar(resolvedHarPath, outPath);
}
