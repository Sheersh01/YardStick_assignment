import type { ToolDefinition } from '../../shared/src/types';

class SkillRegistry {
  private skills: Map<string, ToolDefinition> = new Map();

  register(skill: ToolDefinition) {
    this.skills.set(skill.name, skill);
  }

  getSkill(name: string): ToolDefinition | undefined {
    return this.skills.get(name);
  }

  getAllSkills(): ToolDefinition[] {
    return Array.from(this.skills.values());
  }

  // Converts skills to OpenAI tool format
  getOpenAITools() {
    return this.getAllSkills().map((skill) => ({
      type: 'function',
      function: {
        name: skill.name,
        description: skill.description,
        parameters: skill.parameters,
      },
    }));
  }
}

export const registry = new SkillRegistry();

// Temporarily registering the initial tools as per PRD
registry.register({
  id: 'skill-1',
  name: 'createCard',
  description: 'Create a new card on the Trello board in a specific list.',
  endpoint: '/1/cards',
  method: 'POST',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name of the new card' },
      idList: { type: 'string', description: 'ID of the target list' },
    },
    required: ['name', 'idList'],
  },
});

registry.register({
  id: 'skill-2',
  name: 'moveCard',
  description: 'Move an existing card to a new list.',
  endpoint: '/1/cards/{id}',
  method: 'PUT',
  parameters: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID of the card to move' },
      idList: { type: 'string', description: 'ID of the list to move the card to' },
    },
    required: ['id', 'idList'],
  },
});

registry.register({
  id: 'skill-3',
  name: 'getCurrentBoardLists',
  description: 'Get all lists on the current board. Use this to find list IDs from list names before creating cards.',
  endpoint: '/1/boards/{boardId}/lists',
  method: 'GET',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
});
registry.register({
  id: 'skill-4',
  name: 'createList',
  description: 'Create a new list on the current board.',
  endpoint: '/1/boards/{boardId}/lists',
  method: 'POST',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name of the new list' },
    },
    required: ['name'],
  },
});
