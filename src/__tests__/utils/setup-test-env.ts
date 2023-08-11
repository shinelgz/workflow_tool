
const { env } = process;
process.env = { ...env, team: process.env.team ?? 'open', mode: 'test', content: 'for test\n #{result}', jest: 'true' };

